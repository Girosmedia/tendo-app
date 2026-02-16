import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { logAuditAction, AUDIT_ACTIONS } from '@/lib/audit';
import { closeCashRegisterSchema, type CloseCashRegisterInput } from '@/lib/validators/cash-register';
import { sumRoundedCashTotals } from '@/lib/utils/cash-rounding';

/**
 * POST /api/cash-register/[id]/close
 * Cerrar una caja existente
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData: CloseCashRegisterInput = closeCashRegisterSchema.parse(body);

    // Obtener la caja a cerrar
    const cashRegister = await db.cashRegister.findFirst({
      where: {
        id,
        organizationId: organization.id,
        status: 'OPEN',
      },
    });

    if (!cashRegister) {
      return NextResponse.json(
        { error: 'Caja no encontrada o ya está cerrada' },
        { status: 404 }
      );
    }

    // Verificar que el usuario puede cerrar esta caja
    // Por ahora solo el que la abrió puede cerrarla
    // (En el futuro un ADMIN podría cerrar caja de otro)
    if (cashRegister.openedBy !== session.user.id) {
      return NextResponse.json(
        { error: 'Solo el usuario que abrió la caja puede cerrarla' },
        { status: 403 }
      );
    }

    const now = new Date();

    // Calcular ventas en efectivo del turno
    const cashSales = await db.document.findMany({
      where: {
        organizationId: organization.id,
        createdBy: cashRegister.openedBy,
        status: 'PAID',
        paymentMethod: 'CASH',
        issuedAt: {
          gte: cashRegister.openedAt,
          lte: now,
        },
      },
      select: {
        total: true,
      },
    });

    const totalCashSales = sumRoundedCashTotals(
      cashSales.map((sale) => Number(sale.total))
    );
    const totalCashSalesExact = cashSales.reduce(
      (acc, sale) => acc + Number(sale.total),
      0
    );
    const cashSalesCount = cashSales.length;

    // Calcular todas las ventas del turno (para estadísticas)
    const allSalesData = await db.document.aggregate({
      where: {
        organizationId: organization.id,
        createdBy: cashRegister.openedBy,
        status: 'PAID',
        type: 'SALE',
        issuedAt: {
          gte: cashRegister.openedAt,
          lte: now,
        },
      },
      _sum: { total: true },
      _count: true,
    });

    const totalSales = allSalesData._sum.total
      ? Number(allSalesData._sum.total)
      : 0;
    const salesCount = allSalesData._count;

    // Calcular efectivo esperado y diferencia
    const openingCash = Number(cashRegister.openingCash);
    const expectedCash = openingCash + totalCashSales;
    const actualCash = validatedData.actualCash;
    const difference = actualCash - expectedCash;

    // Actualizar la caja
    const updatedCashRegister = await db.cashRegister.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedBy: session.user.id,
        closedAt: now,
        expectedCash,
        actualCash,
        difference,
        totalSales,
        salesCount,
        notes: validatedData.notes
          ? `${cashRegister.notes || ''}\n\n--- CIERRE ---\n${validatedData.notes}`.trim()
          : cashRegister.notes,
      },
    });

    // Audit log
    await logAuditAction({
      userId: session.user.id,
      action: AUDIT_ACTIONS.CLOSE_CASH_REGISTER,
      resource: 'CashRegister',
      resourceId: updatedCashRegister.id,
      changes: {
        expectedCash,
        actualCash,
        difference,
        totalSales,
        salesCount,
        cashSalesCount,
        totalCashSales,
        totalCashSalesExact,
      },
    });

    return NextResponse.json({
      cashRegister: {
        ...updatedCashRegister,
        openingCash: Number(updatedCashRegister.openingCash),
        expectedCash: Number(updatedCashRegister.expectedCash),
        actualCash: Number(updatedCashRegister.actualCash!),
        difference: Number(updatedCashRegister.difference!),
        totalSales: Number(updatedCashRegister.totalSales),
      },
      summary: {
        cashSalesCount,
        totalCashSales,
        otherMethodsSales: totalSales - totalCashSalesExact,
      },
    });
  } catch (error) {
    console.error('Error al cerrar caja:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al cerrar caja registradora' },
      { status: 500 }
    );
  }
}
