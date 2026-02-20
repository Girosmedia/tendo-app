import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { logAuditAction } from '@/lib/audit';
import { createQuoteSchema } from '@/lib/validators/document';
import { z } from 'zod';
import { hasModuleAccess } from '@/lib/entitlements';

// GET /api/services/quotes - Listar cotizaciones
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

    if (!hasModuleAccess({
      organizationPlan: organization.plan,
      subscriptionPlanId: organization.subscription?.planId,
      organizationModules: organization.modules,
    }, 'QUOTES')) {
      return NextResponse.json({ error: 'Módulo Cotizaciones no habilitado para tu plan' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const quotes = await db.document.findMany({
      where: {
        organizationId: organization.id,
        type: 'QUOTE',
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
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        items: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        issuedAt: 'desc',
      },
      take: Number.isNaN(limit) ? 100 : Math.min(limit, 300),
    });

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { error: 'Error al obtener cotizaciones' },
      { status: 500 }
    );
  }
}

// POST /api/services/quotes - Crear cotización
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

    if (!hasModuleAccess({
      organizationPlan: organization.plan,
      subscriptionPlanId: organization.subscription?.planId,
      organizationModules: organization.modules,
    }, 'QUOTES')) {
      return NextResponse.json({ error: 'Módulo Cotizaciones no habilitado para tu plan' }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = createQuoteSchema.parse(body);

    const itemsWithTotals = validatedData.items.map((item) => {
      const totalBruto = item.quantity * item.unitPrice - item.discount;
      const divisor = 1 + item.taxRate / 100;
      const subtotal = totalBruto / divisor;
      const taxAmount = totalBruto - subtotal;

      return {
        ...item,
        subtotal,
        taxAmount,
        total: totalBruto,
      };
    });

    const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = itemsWithTotals.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = subtotal + taxAmount - validatedData.discount;

    const lastQuote = await db.document.findFirst({
      where: {
        organizationId: organization.id,
        type: 'QUOTE',
      },
      orderBy: {
        docNumber: 'desc',
      },
      select: {
        docNumber: true,
      },
    });

    const quote = await db.document.create({
      data: {
        organizationId: organization.id,
        customerId: validatedData.customerId,
        type: 'QUOTE',
        status: validatedData.status,
        docNumber: (lastQuote?.docNumber || 0) + 1,
        docPrefix: validatedData.docPrefix || 'COT',
        dueAt: validatedData.dueAt ? new Date(validatedData.dueAt) : null,
        paymentMethod: validatedData.paymentMethod,
        subtotal,
        taxRate: validatedData.taxRate,
        taxAmount,
        discount: validatedData.discount,
        total,
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
            discountPercent: item.discountPercent || null,
            taxRate: item.taxRate,
            subtotal: item.subtotal,
            taxAmount: item.taxAmount,
            total: item.total,
          })),
        },
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
        items: true,
      },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'CREATE_QUOTE',
      resource: 'Document',
      resourceId: quote.id,
      changes: {
        type: 'QUOTE',
        status: quote.status,
        total: Number(quote.total),
      },
    });

    return NextResponse.json({ quote }, { status: 201 });
  } catch (error) {
    console.error('Error creating quote:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear cotización' },
      { status: 500 }
    );
  }
}
