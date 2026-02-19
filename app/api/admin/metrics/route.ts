import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const now = new Date();
    const startOfThisMonth = startOfMonth(now);
    const startOfLastMonth = startOfMonth(subMonths(now, 1));
    const endOfLastMonth = endOfMonth(subMonths(now, 1));

    // MRR: Suma de MRR de suscripciones activas
    const activeSubscriptions = await db.subscription.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        mrr: true,
      },
    });

    const mrr = activeSubscriptions.reduce((sum: number, sub) => sum + Number(sub.mrr), 0);
    const arr = mrr * 12;

    // Trial count
    const trialCount = await db.subscription.count({
      where: {
        status: 'TRIAL',
      },
    });

    // Organizaciones totales
    const totalOrgs = await db.organization.count();

    // Organizaciones activas (con al menos una venta en los últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeOrgs = await db.organization.count({
      where: {
        documents: {
          some: {
            createdAt: {
              gte: thirtyDaysAgo,
            },
          },
        },
      },
    });

    // Churn: organizaciones canceladas o suspendidas este mes vs total inicio de mes
    const orgsAtStartOfMonth = await db.subscription.count({
      where: {
        createdAt: {
          lt: startOfThisMonth,
        },
      },
    });

    const churnedThisMonth = await db.subscription.count({
      where: {
        status: {
          in: ['CANCELED', 'SUSPENDED'],
        },
        OR: [
          {
            canceledAt: {
              gte: startOfThisMonth,
            },
          },
          {
            updatedAt: {
              gte: startOfThisMonth,
            },
            status: 'SUSPENDED',
          },
        ],
      },
    });

    const churnRate = orgsAtStartOfMonth > 0 
      ? (churnedThisMonth / orgsAtStartOfMonth) * 100 
      : 0;

    // New MRR: organizaciones activadas este mes
    const newSubscriptionsThisMonth = await db.subscription.findMany({
      where: {
        status: 'ACTIVE',
        createdAt: {
          gte: startOfThisMonth,
        },
      },
      select: {
        mrr: true,
      },
    });

    const newMrr = newSubscriptionsThisMonth.reduce((sum: number, sub) => sum + Number(sub.mrr), 0);

    // Growth: nuevas organizaciones por mes (últimos 12 meses)
    const growthData = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));

      const count = await db.organization.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      growthData.push({
        month: format(monthStart, 'MMM yyyy'),
        count,
      });
    }

    return NextResponse.json({
      mrr: Math.round(mrr),
      arr: Math.round(arr),
      trialCount,
      totalOrgs,
      activeOrgs,
      churnRate: Math.round(churnRate * 10) / 10, // 1 decimal
      newMrr: Math.round(newMrr),
      growthData,
    });
  } catch (error) {
    console.error('Error al obtener métricas admin:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
