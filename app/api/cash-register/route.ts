import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { logAuditAction, AUDIT_ACTIONS } from '@/lib/audit';
import {
  openCashRegisterSchema,
  listCashRegistersSchema,
  type OpenCashRegisterInput,
} from '@/lib/validators/cash-register';

/**
 * GET /api/cash-register
 * Listar historial de cierres de caja
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    };

    const validatedParams = listCashRegistersSchema.parse(queryParams);

    // Construir filtros
    const where: any = {
      organizationId: organization.id,
    };

    if (validatedParams.startDate || validatedParams.endDate) {
      where.openedAt = {};
      if (validatedParams.startDate) {
        where.openedAt.gte = new Date(validatedParams.startDate);
      }
      if (validatedParams.endDate) {
        where.openedAt.lte = new Date(validatedParams.endDate);
      }
    }

    // Paginación
    const skip = (validatedParams.page - 1) * validatedParams.limit;
    const take = validatedParams.limit;

    // Obtener datos
    const [cashRegisters, totalCount] = await Promise.all([
      db.cashRegister.findMany({
        where,
        orderBy: { openedAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          status: true,
          openedBy: true,
          closedBy: true,
          openedAt: true,
          closedAt: true,
          openingCash: true,
          expectedCash: true,
          actualCash: true,
          difference: true,
          totalSales: true,
          salesCount: true,
          notes: true,
        },
      }),
      db.cashRegister.count({ where }),
    ]);

    // Convertir Decimals a números y calcular datos en tiempo real para cajas abiertas
    const formattedRegisters = await Promise.all(
      cashRegisters.map(async (register: any) => {
        let salesCount = Number(register.salesCount);
        let totalSales = Number(register.totalSales);
        let expectedCash = Number(register.expectedCash);

        // Si la caja está OPEN, calcular valores en tiempo real
        if (register.status === 'OPEN') {
          const now = new Date();
          
          // Calcular ventas totales y por método de pago
          const [allSalesData, cashSalesData, cardSalesData, transferSalesData, multiSalesData] = await Promise.all([
            db.document.aggregate({
              where: {
                organizationId: organization.id,
                createdBy: register.openedBy,
                status: 'PAID',
                issuedAt: {
                  gte: register.openedAt,
                  lte: now,
                },
              },
              _sum: {
                total: true,
              },
              _count: true,
            }),
            db.document.aggregate({
              where: {
                organizationId: organization.id,
                createdBy: register.openedBy,
                status: 'PAID',
                paymentMethod: 'CASH',
                issuedAt: {
                  gte: register.openedAt,
                  lte: now,
                },
              },
              _sum: {
                total: true,
              },
            }),
            db.document.aggregate({
              where: {
                organizationId: organization.id,
                createdBy: register.openedBy,
                status: 'PAID',
                paymentMethod: 'CARD',
                issuedAt: {
                  gte: register.openedAt,
                  lte: now,
                },
              },
              _sum: {
                total: true,
              },
            }),
            db.document.aggregate({
              where: {
                organizationId: organization.id,
                createdBy: register.openedBy,
                status: 'PAID',
                paymentMethod: 'TRANSFER',
                issuedAt: {
                  gte: register.openedAt,
                  lte: now,
                },
              },
              _sum: {
                total: true,
              },
            }),
            db.document.aggregate({
              where: {
                organizationId: organization.id,
                createdBy: register.openedBy,
                status: 'PAID',
                paymentMethod: 'MULTI',
                issuedAt: {
                  gte: register.openedAt,
                  lte: now,
                },
              },
              _sum: {
                total: true,
              },
            }),
          ]);

          salesCount = allSalesData._count || 0;
          totalSales = Number(allSalesData._sum.total || 0);
          const totalCashSales = Number(cashSalesData._sum.total || 0);
          expectedCash = Number(register.openingCash) + totalCashSales;

          // Agregar totales por método de pago
          register.totalCashSales = totalCashSales;
          register.totalCardSales = Number(cardSalesData._sum.total || 0);
          register.totalTransferSales = Number(transferSalesData._sum.total || 0);
          register.totalMultiSales = Number(multiSalesData._sum.total || 0);
        }

        return {
          ...register,
          openingCash: Number(register.openingCash),
          expectedCash,
          actualCash: register.actualCash ? Number(register.actualCash) : null,
          difference: register.difference ? Number(register.difference) : null,
          totalSales,
          salesCount,
          totalCashSales: register.totalCashSales || 0,
          totalCardSales: register.totalCardSales || 0,
          totalTransferSales: register.totalTransferSales || 0,
          totalMultiSales: register.totalMultiSales || 0,
        };
      })
    );

    return NextResponse.json({
      cashRegisters: formattedRegisters,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        totalCount,
        totalPages: Math.ceil(totalCount / validatedParams.limit),
      },
    });
  } catch (error) {
    console.error('Error al listar cajas:', error);
    return NextResponse.json(
      { error: 'Error al listar cajas registradoras' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cash-register
 * Abrir nueva caja
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData: OpenCashRegisterInput = openCashRegisterSchema.parse(body);

    // Verificar si el usuario ya tiene una caja abierta
    const existingOpenCashRegister = await db.cashRegister.findFirst({
      where: {
        organizationId: organization.id,
        openedBy: session.user.id,
        status: 'OPEN',
      },
    });

    if (existingOpenCashRegister) {
      return NextResponse.json(
        { 
          error: 'Ya tienes una caja abierta',
          cashRegisterId: existingOpenCashRegister.id,
        },
        { status: 400 }
      );
    }

    // Crear nueva caja
    const cashRegister = await db.cashRegister.create({
      data: {
        organizationId: organization.id,
        openedBy: session.user.id,
        openingCash: validatedData.openingCash,
        notes: validatedData.notes || null,
        status: 'OPEN',
      },
    });

    // Audit log
    await logAuditAction({
      userId: session.user.id,
      action: AUDIT_ACTIONS.OPEN_CASH_REGISTER,
      resource: 'CashRegister',
      resourceId: cashRegister.id,
      changes: {
        openingCash: Number(cashRegister.openingCash),
        notes: cashRegister.notes,
      },
    });

    return NextResponse.json(
      {
        cashRegister: {
          ...cashRegister,
          openingCash: Number(cashRegister.openingCash),
          expectedCash: Number(cashRegister.expectedCash),
          totalSales: Number(cashRegister.totalSales),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al abrir caja:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al abrir caja registradora' },
      { status: 500 }
    );
  }
}
