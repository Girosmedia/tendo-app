import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { sumRoundedCashTotals } from '@/lib/utils/cash-rounding';

/**
 * GET /api/cash-register/active
 * Verificar si el usuario actual tiene una caja abierta
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    // Buscar caja abierta del usuario
    const activeCashRegister = await db.cashRegister.findFirst({
      where: {
        organizationId: organization.id,
        openedBy: session.user.id,
        status: 'OPEN',
      },
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
      },
    });

    if (!activeCashRegister) {
      return NextResponse.json({
        hasActiveCashRegister: false,
        cashRegister: null,
      });
    }

    const now = new Date();
    const [allSalesData, cashSales] = await Promise.all([
      db.document.aggregate({
        where: {
          organizationId: organization.id,
          createdBy: activeCashRegister.openedBy,
          status: 'PAID',
          issuedAt: {
            gte: activeCashRegister.openedAt,
            lte: now,
          },
        },
        _sum: {
          total: true,
        },
        _count: true,
      }),
      db.document.findMany({
        where: {
          organizationId: organization.id,
          createdBy: activeCashRegister.openedBy,
          status: 'PAID',
          paymentMethod: 'CASH',
          issuedAt: {
            gte: activeCashRegister.openedAt,
            lte: now,
          },
        },
        select: {
          total: true,
        },
      }),
    ]);

    const totalSales = Number(allSalesData._sum.total || 0);
    const salesCount = allSalesData._count || 0;
    const totalCashSalesRounded = sumRoundedCashTotals(
      cashSales.map((sale) => Number(sale.total))
    );
    const expectedCash = Number(activeCashRegister.openingCash) + totalCashSalesRounded;

    return NextResponse.json({
      hasActiveCashRegister: true,
      cashRegister: {
        id: activeCashRegister.id,
        status: activeCashRegister.status,
        openedBy: activeCashRegister.openedBy,
        closedBy: activeCashRegister.closedBy,
        openedAt: activeCashRegister.openedAt.toISOString(),
        closedAt: activeCashRegister.closedAt ? activeCashRegister.closedAt.toISOString() : null,
        openingCash: Number(activeCashRegister.openingCash),
        expectedCash,
        actualCash: activeCashRegister.actualCash ? Number(activeCashRegister.actualCash) : null,
        difference: activeCashRegister.difference ? Number(activeCashRegister.difference) : null,
        totalSales,
        salesCount,
      },
    });
  } catch (error) {
    console.error('Error verificando caja activa:', error);
    return NextResponse.json(
      { error: 'Error al verificar caja activa' },
      { status: 500 }
    );
  }
}
