import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { logAuditAction } from '@/lib/audit';
import { createDocumentSchema } from '@/lib/validators/document';
import { calculateDocumentTotals } from '@/lib/utils/document-totals';
import { roundCashPaymentAmount } from '@/lib/utils/cash-rounding';

// GET /api/documents - Listar documentos
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 404 }
      );
    }

    // Query params para filtrado
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const documents = await db.document.findMany({
      where: {
        organizationId: organization.id,
        ...(type && { type: type as any }),
        ...(status && { status: status as any }),
        ...(customerId && { customerId }),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            rut: true,
            company: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        issuedAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Error al obtener documentos' },
      { status: 500 }
    );
  }
}

// POST /api/documents - Crear documento
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 404 }
      );
    }

    const json = await req.json();
    const validatedData = createDocumentSchema.parse(json);

    // Validar que haya caja abierta para ventas
    if (validatedData.type === 'SALE' && validatedData.status === 'PAID') {
      const activeCashRegister = await db.cashRegister.findFirst({
        where: {
          organizationId: organization.id,
          openedBy: session.user.id,
          status: 'OPEN',
        },
      });

      if (!activeCashRegister) {
        return NextResponse.json(
          { 
            error: 'Debes abrir una caja registradora antes de procesar ventas',
            code: 'NO_ACTIVE_CASH_REGISTER'
          },
          { status: 400 }
        );
      }
    }

    const totalsCalculation = calculateDocumentTotals(
      validatedData.items.map((item) => ({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        taxRate: item.taxRate,
      })),
      validatedData.discount
    );

    if (validatedData.discount > totalsCalculation.grossBeforeGlobalDiscount) {
      return NextResponse.json(
        {
          error: 'El descuento global no puede superar el total bruto de los ítems',
        },
        { status: 400 }
      );
    }

    const itemsWithTotals = validatedData.items.map((item, index) => ({
      ...item,
      subtotal: totalsCalculation.items[index].subtotal,
      taxAmount: totalsCalculation.items[index].taxAmount,
      total: totalsCalculation.items[index].total,
    }));

    const subtotal = totalsCalculation.subtotal;
    const taxAmount = totalsCalculation.taxAmount;
    const total = totalsCalculation.total;
    const roundedCashTotal = roundCashPaymentAmount(total);

    if (
      validatedData.paymentMethod === 'CASH' &&
      validatedData.cashReceived !== undefined &&
      validatedData.cashReceived !== null &&
      validatedData.cashReceived < roundedCashTotal
    ) {
      return NextResponse.json(
        {
          error: 'El efectivo recibido no alcanza el total a pagar con redondeo legal',
          code: 'INSUFFICIENT_CASH',
          details: {
            roundedCashTotal,
            cashReceived: validatedData.cashReceived,
          },
        },
        { status: 400 }
      );
    }

    // Calcular vuelto si es pago en efectivo
    const cashChange =
      validatedData.paymentMethod === 'CASH' && validatedData.cashReceived
        ? validatedData.cashReceived - roundedCashTotal
        : null;

    // Obtener el siguiente número de documento para este tipo
    const lastDoc = await db.document.findFirst({
      where: {
        organizationId: organization.id,
        type: validatedData.type,
      },
      orderBy: {
        docNumber: 'desc',
      },
      select: {
        docNumber: true,
      },
    });

    const docNumber = (lastDoc?.docNumber || 0) + 1;

    // Usar el status directamente del request
    const status = validatedData.status;
    const paidAt = status === 'PAID' ? new Date() : null;
    
    // Determinar si se debe decrementar stock
    const shouldDecrementStock = 
      validatedData.type === 'SALE' && 
      status === 'PAID';

    // Validar límite de crédito si el método de pago es CREDIT
    if (validatedData.paymentMethod === 'CREDIT' && validatedData.customerId) {
      const customer = await db.customer.findUnique({
        where: { id: validatedData.customerId },
        select: { creditLimit: true, currentDebt: true, name: true },
      });

      if (!customer) {
        return NextResponse.json(
          { error: 'Cliente no encontrado' },
          { status: 404 }
        );
      }

      const creditLimit = Number(customer.creditLimit) || 0;
      const currentDebt = Number(customer.currentDebt) || 0;
      const availableCredit = creditLimit - currentDebt;

      if (total > availableCredit) {
        return NextResponse.json(
          {
            error: 'Límite de crédito excedido',
            code: 'CREDIT_LIMIT_EXCEEDED',
            details: {
              customerName: customer.name,
              creditLimit,
              currentDebt,
              availableCredit,
              saleTotal: total,
            },
          },
          { status: 400 }
        );
      }
    }

    // Crear documento con items
    const document = await db.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          organizationId: organization.id,
          customerId: validatedData.customerId,
          type: validatedData.type,
          status,
          docNumber,
          docPrefix: validatedData.docPrefix,
          dueAt: validatedData.dueAt ? new Date(validatedData.dueAt) : null,
          paidAt,
          paymentMethod: validatedData.paymentMethod,
          subtotal: subtotal,
          taxRate: validatedData.taxRate,
          taxAmount: taxAmount,
          discount: totalsCalculation.globalDiscountApplied,
          total: total,
          cashReceived: validatedData.cashReceived
            ? validatedData.cashReceived
            : null,
          cashChange: cashChange ? cashChange : null,
          notes: validatedData.notes,
          createdBy: session.user.id,
          items: {
            create: itemsWithTotals.map((item) => ({
              productId: item.productId,
              sku: item.sku,
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              discount: item.discount,
              discountPercent: item.discountPercent
                ? item.discountPercent
                : null,
              taxRate: item.taxRate,
              subtotal: item.subtotal,
              taxAmount: item.taxAmount,
              total: item.total,
            })),
          },
        },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Si el método de pago es CREDIT, crear el registro de crédito y actualizar deuda del cliente
      if (validatedData.paymentMethod === 'CREDIT' && validatedData.customerId) {
        // Calcular fecha de vencimiento (30 días por defecto)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        // Crear el crédito
        await tx.credit.create({
          data: {
            organizationId: organization.id,
            customerId: validatedData.customerId,
            documentId: doc.id,
            amount: total,
            balance: total,
            status: 'ACTIVE',
            dueDate,
            description: `Venta #${docNumber}`,
          },
        });

        // Actualizar la deuda del cliente
        await tx.customer.update({
          where: { id: validatedData.customerId },
          data: {
            currentDebt: {
              increment: total,
            },
          },
        });
      }

      return doc;
    });

    // Si es una venta pagada, decrementar stock de productos
    if (shouldDecrementStock) {
      for (const item of itemsWithTotals) {
        if (item.productId) {
          const product = await db.product.findUnique({
            where: { id: item.productId },
            select: { trackInventory: true, currentStock: true },
          });

          if (product?.trackInventory) {
            await db.product.update({
              where: { id: item.productId },
              data: {
                currentStock: {
                  decrement: Math.floor(item.quantity),
                },
              },
            });
          }
        }
      }
    }

    // Audit log
    await logAuditAction({
      userId: session.user.id,
      action: 'CREATE_DOCUMENT',
      resource: 'Document',
      resourceId: document.id,
      changes: {
        type: document.type,
        total: document.total.toString(),
        itemsCount: document.items.length,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear documento' },
      { status: 500 }
    );
  }
}
