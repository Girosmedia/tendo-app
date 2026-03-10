import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { Prisma } from '@/lib/generated/prisma/client/client';
import { getCurrentOrganization } from '@/lib/organization';
import { calculateManagementMetrics, calculateCashFlowMetrics, calculateExposureMetrics } from '@/lib/utils/accounting-engine';
import {
  getChileNow,
  getStartOfToday,
  getStartOfYesterday,
  getStartOfThisWeek,
  getEndOfThisWeek,
  getStartOfLastWeek,
  getEndOfLastWeek,
  getStartOfThisMonth,
  getEndOfThisMonth,
  getStartOfLastMonth,
  getEndOfLastMonth,
  getStartOfThisQuarter,
  getEndOfThisQuarter,
  getStartOfLastQuarter,
  getEndOfLastQuarter,
  getDaysAgo,
  decimalToNumber,
  calculateGrowth,
} from '@/lib/utils/dashboard-helpers';
import { hasModuleAccess } from '@/lib/entitlements';
import { endOfMonth, startOfMonth, subMonths } from 'date-fns';

type DashboardPeriod = 'today' | 'week' | 'month' | 'last_month' | 'quarter';

function parsePeriod(rawPeriod: string | null): DashboardPeriod {
  if (
    rawPeriod === 'today' ||
    rawPeriod === 'week' ||
    rawPeriod === 'month' ||
    rawPeriod === 'last_month' ||
    rawPeriod === 'quarter'
  ) {
    return rawPeriod;
  }

  return 'month';
}

/**
 * GET /api/dashboard/kpis
 * Retorna métricas calculadas del dashboard para la organización actual.
 * Query param: period = 'today' | 'week' | 'month' | 'last_month' | 'quarter'
 */
export async function GET(request: NextRequest) {
  const period = parsePeriod(new URL(request.url).searchParams.get('period'));

  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    const organizationId = organization.id;
    const hasProjectsModule = hasModuleAccess({
      organizationPlan: organization.plan,
      subscriptionPlanId: organization.subscription?.planId,
      organizationModules: organization.modules,
    }, 'PROJECTS');

    const periodLabelMap: Record<DashboardPeriod, string> = {
      today: 'Hoy',
      week: 'Esta semana',
      month: 'Este mes',
      last_month: 'Mes anterior',
      quarter: 'Este trimestre',
    };

    const compareLabelMap: Record<DashboardPeriod, string> = {
      today: 'ayer',
      week: 'semana anterior',
      month: 'mes anterior',
      last_month: 'mes previo',
      quarter: 'trimestre anterior',
    };

    // Fechas de referencia
    const startToday = getStartOfToday();
    const startYesterday = getStartOfYesterday();
    const startThisMonth = getStartOfThisMonth();
    const endThisMonth = getEndOfThisMonth();
    const startLastMonth = getStartOfLastMonth();
    const endLastMonth = getEndOfLastMonth();
    const startThisWeek = getStartOfThisWeek();
    const endThisWeek = getEndOfThisWeek();
    const startLastWeek = getStartOfLastWeek();
    const endLastWeek = getEndOfLastWeek();
    const startThisQuarter = getStartOfThisQuarter();
    const endThisQuarter = getEndOfThisQuarter();
    const startLastQuarter = getStartOfLastQuarter();
    const endLastQuarter = getEndOfLastQuarter();
    const last30Days = getDaysAgo(30);
    const last7Days = getDaysAgo(7);

    const now = getChileNow();

    let currentPeriodStart = startThisMonth;
    let currentPeriodEnd = endThisMonth;
    let previousPeriodStart = startLastMonth;
    let previousPeriodEnd = endLastMonth;

    if (period === 'today') {
      currentPeriodStart = startToday;
      currentPeriodEnd = now;
      previousPeriodStart = startYesterday;
      previousPeriodEnd = startToday;
    } else if (period === 'week') {
      currentPeriodStart = startThisWeek;
      currentPeriodEnd = endThisWeek;
      previousPeriodStart = startLastWeek;
      previousPeriodEnd = endLastWeek;
    } else if (period === 'last_month') {
      currentPeriodStart = startLastMonth;
      currentPeriodEnd = endLastMonth;
      const twoMonthsAgo = subMonths(startLastMonth, 1);
      previousPeriodStart = startOfMonth(twoMonthsAgo);
      previousPeriodEnd = endOfMonth(twoMonthsAgo);
    } else if (period === 'quarter') {
      currentPeriodStart = startThisQuarter;
      currentPeriodEnd = endThisQuarter;
      previousPeriodStart = startLastQuarter;
      previousPeriodEnd = endLastQuarter;
    }

    // === VENTAS DEL DÍA ===
    const salesTodayData = await db.document.aggregate({
      where: {
        organizationId,
        type: 'SALE',
        status: 'PAID',
        issuedAt: { gte: startToday },
      },
      _sum: {
        subtotal: true,
        taxAmount: true,
        discount: true,
        total: true,
      },
      _count: true,
    });

    const salesTodayTotal = decimalToNumber(salesTodayData._sum.total);
    const salesTodayTax = decimalToNumber(salesTodayData._sum.taxAmount);
    const salesTodayGlobalDiscount = decimalToNumber(salesTodayData._sum.discount);
    const salesTodayNet = salesTodayTotal - salesTodayTax;
    const salesTodayTaxableBaseBeforeGlobalDiscount = salesTodayNet + salesTodayGlobalDiscount;
    const salesTodayCount = salesTodayData._count;
    const avgTicketToday = salesTodayCount > 0 ? salesTodayTotal / salesTodayCount : 0;

    // === VENTAS DE AYER (para comparación) ===
    const salesYesterdayData = await db.document.aggregate({
      where: {
        organizationId,
        type: 'SALE',
        status: 'PAID',
        issuedAt: {
          gte: startYesterday,
          lt: startToday,
        },
      },
      _sum: { total: true },
    });

    const salesYesterdayTotal = decimalToNumber(salesYesterdayData._sum.total);
    const salesGrowthVsYesterday = calculateGrowth(salesTodayTotal, salesYesterdayTotal);

    // === VENTAS DEL MES ACTUAL ===
    const salesThisMonthData = await db.document.aggregate({
      where: {
        organizationId,
        type: 'SALE',
        status: 'PAID',
        issuedAt: {
          gte: startThisMonth,
          lte: endThisMonth,
        },
      },
      _sum: {
        subtotal: true,
        taxAmount: true,
        discount: true,
        total: true,
      },
      _count: true,
    });

    const salesThisMonthTotal = decimalToNumber(salesThisMonthData._sum.total);
    const salesThisMonthTax = decimalToNumber(salesThisMonthData._sum.taxAmount);
    const salesThisMonthGlobalDiscount = decimalToNumber(salesThisMonthData._sum.discount);
    const salesThisMonthNet = salesThisMonthTotal - salesThisMonthTax;
    const salesThisMonthTaxableBaseBeforeGlobalDiscount =
      salesThisMonthNet + salesThisMonthGlobalDiscount;
    const salesThisMonthCount = salesThisMonthData._count;

    // === VENTAS DEL MES ANTERIOR ===
    const salesLastMonthData = await db.document.aggregate({
      where: {
        organizationId,
        type: 'SALE',
        status: 'PAID',
        issuedAt: {
          gte: startLastMonth,
          lte: endLastMonth,
        },
      },
      _sum: { total: true },
    });

    const salesLastMonthTotal = decimalToNumber(salesLastMonthData._sum.total);
    const salesGrowthVsLastMonth = calculateGrowth(salesThisMonthTotal, salesLastMonthTotal);

    // === VENTAS HISTÓRICAS ===
    const salesAllTimeData = await db.document.aggregate({
      where: {
        organizationId,
        type: 'SALE',
        status: 'PAID',
      },
      _sum: { total: true },
      _count: true,
    });

    const salesAllTimeTotal = decimalToNumber(salesAllTimeData._sum.total);
    const salesAllTimeCount = salesAllTimeData._count;

    async function getSalesAggregateByRange(startDate: Date, endDate: Date) {
      const salesData = await db.document.aggregate({
        where: {
          organizationId,
          type: 'SALE',
          status: 'PAID',
          issuedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          subtotal: true,
          taxAmount: true,
          discount: true,
          total: true,
        },
        _count: true,
      });

      const total = decimalToNumber(salesData._sum.total);
      const tax = decimalToNumber(salesData._sum.taxAmount);
      const globalDiscount = decimalToNumber(salesData._sum.discount);
      const net = total - tax;
      const taxableBaseBeforeGlobalDiscount = net + globalDiscount;
      const count = salesData._count;
      const avgTicket = count > 0 ? total / count : 0;

      return {
        total,
        tax,
        net,
        globalDiscount,
        taxableBaseBeforeGlobalDiscount,
        count,
        avgTicket,
      };
    }

    async function getFinancialAggregateByRange(startDate: Date, endDate: Date) {
      const [salesItems, cardCommissionsData, operationalExpensesData] = await Promise.all([
        db.documentItem.findMany({
          where: {
            document: {
              organizationId,
              type: 'SALE',
              status: 'PAID',
              issuedAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
          select: {
            quantity: true,
            // Sprint 2: unitCost = snapshot histórico. Fallback a product.cost para datos pre-backfill.
            unitCost: true,
            product: {
              select: {
                cost: true,
              },
            },
          },
        }),
        db.$queryRaw<Array<{ total: Prisma.Decimal | number | null }>>(Prisma.sql`
          SELECT COALESCE(SUM(card_commission_amount), 0) AS total
          FROM documents
          WHERE organization_id = ${organizationId}
            AND type = 'SALE'
            AND status = 'PAID'
            AND payment_method = 'CARD'
            AND issued_at >= ${startDate}
            AND issued_at <= ${endDate}
        `),
        db.operationalExpense.aggregate({
          where: {
            organizationId,
            expenseDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: {
            amount: true,
          },
          _count: true,
        }),
      ]);

      const salesTotals = await getSalesAggregateByRange(startDate, endDate);

      const salesItemsWithCost = salesItems.filter(
        (item) => item.unitCost !== null || item.product?.cost !== null
      );
      const itemsWithoutCost = salesItems.length - salesItemsWithCost.length;

      const costOfSales = Math.round(
        salesItems.reduce((sum, item) => {
          const snapshotCost = decimalToNumber(item.unitCost);
          const liveCost = decimalToNumber(item.product?.cost);
          const effectiveCost = snapshotCost > 0 ? snapshotCost : liveCost > 0 ? liveCost : 0;
          return sum + effectiveCost * decimalToNumber(item.quantity);
        }, 0)
      );

      const grossProfit = Math.round(salesTotals.net - costOfSales);
      const grossMarginPercent = salesTotals.net > 0 ? (grossProfit / salesTotals.net) * 100 : 0;

      const cardCommissions = Math.round(decimalToNumber(cardCommissionsData[0]?.total));
      const operationalExpenses = Math.round(decimalToNumber(operationalExpensesData._sum.amount));
      const operationalExpensesCount = operationalExpensesData._count;

      const realProfit = grossProfit - operationalExpenses - cardCommissions;
      const realMarginPercent = salesTotals.net > 0 ? (realProfit / salesTotals.net) * 100 : 0;

      return {
        grossSales: Math.round(salesTotals.total),
        netSales: Math.round(salesTotals.net),
        taxableBaseBeforeGlobalDiscount: Math.round(salesTotals.taxableBaseBeforeGlobalDiscount),
        globalDiscount: Math.round(salesTotals.globalDiscount),
        taxAmount: Math.round(salesTotals.tax),
        count: salesTotals.count,
        avgTicket: Math.round(salesTotals.avgTicket),
        costOfSales,
        grossProfit,
        operationalExpenses,
        cardCommissions,
        operationalExpensesCount,
        realProfit,
        grossMarginPercent: Math.round(grossMarginPercent * 10) / 10,
        realMarginPercent: Math.round(realMarginPercent * 10) / 10,
        itemsWithoutCost,
        costCoveragePercent: salesItems.length > 0
          ? Math.round((salesItemsWithCost.length / salesItems.length) * 1000) / 10
          : 100,
      };
    }

    const [periodSalesCurrent, periodSalesPrevious, periodFinancialCurrent, periodFinancialPrevious] = await Promise.all([
      getSalesAggregateByRange(currentPeriodStart, currentPeriodEnd),
      getSalesAggregateByRange(previousPeriodStart, previousPeriodEnd),
      getFinancialAggregateByRange(currentPeriodStart, currentPeriodEnd),
      getFinancialAggregateByRange(previousPeriodStart, previousPeriodEnd),
    ]);

    const periodGrowthVsPrevious = calculateGrowth(periodSalesCurrent.total, periodSalesPrevious.total);

    // === COSTO DE VENTA Y MARGEN (hoy/mes) ===
    const [salesTodayItems, salesThisMonthItems, cardCommissionsTodayData, cardCommissionsThisMonthData] = await Promise.all([
      db.documentItem.findMany({
        where: {
          document: {
            organizationId,
            type: 'SALE',
            status: 'PAID',
            issuedAt: { gte: startToday },
          },
        },
        select: {
          quantity: true,
          unitCost: true,
          product: {
            select: {
              cost: true,
            },
          },
        },
      }),
      db.documentItem.findMany({
        where: {
          document: {
            organizationId,
            type: 'SALE',
            status: 'PAID',
            issuedAt: {
              gte: startThisMonth,
              lte: endThisMonth,
            },
          },
        },
        select: {
          quantity: true,
          unitCost: true,
          product: {
            select: {
              cost: true,
            },
          },
        },
      }),
      db.$queryRaw<Array<{ total: Prisma.Decimal | number | null }>>(Prisma.sql`
        SELECT COALESCE(SUM(card_commission_amount), 0) AS total
        FROM documents
        WHERE organization_id = ${organizationId}
          AND type = 'SALE'
          AND status = 'PAID'
          AND payment_method = 'CARD'
          AND issued_at >= ${startToday}
      `),
      db.$queryRaw<Array<{ total: Prisma.Decimal | number | null }>>(Prisma.sql`
        SELECT COALESCE(SUM(card_commission_amount), 0) AS total
        FROM documents
        WHERE organization_id = ${organizationId}
          AND type = 'SALE'
          AND status = 'PAID'
          AND payment_method = 'CARD'
          AND issued_at >= ${startThisMonth}
          AND issued_at <= ${endThisMonth}
      `),
    ]);

    const cardCommissionsToday = Math.round(decimalToNumber(cardCommissionsTodayData[0]?.total));
    const cardCommissionsThisMonth = Math.round(decimalToNumber(cardCommissionsThisMonthData[0]?.total));

    const salesTodayItemsWithCost = salesTodayItems.filter(
      (item) => item.unitCost !== null || item.product?.cost !== null
    );
    const salesTodayItemsWithoutCost = salesTodayItems.length - salesTodayItemsWithCost.length;

    const costOfSalesToday = Math.round(
      salesTodayItems.reduce((sum, item) => {
        const snapshotCost = decimalToNumber(item.unitCost);
        const liveCost = decimalToNumber(item.product?.cost);
        const effectiveCost = snapshotCost > 0 ? snapshotCost : liveCost > 0 ? liveCost : 0;
        return sum + effectiveCost * decimalToNumber(item.quantity);
      }, 0)
    );

    const grossProfitToday = Math.round(salesTodayNet - costOfSalesToday);
    const grossMarginTodayPercent = salesTodayNet > 0 ? (grossProfitToday / salesTodayNet) * 100 : 0;

    const salesThisMonthItemsWithCost = salesThisMonthItems.filter(
      (item) => item.unitCost !== null || item.product?.cost !== null
    );
    const salesThisMonthItemsWithoutCost = salesThisMonthItems.length - salesThisMonthItemsWithCost.length;

    const costOfSalesThisMonth = Math.round(
      salesThisMonthItems.reduce((sum, item) => {
        const snapshotCost = decimalToNumber(item.unitCost);
        const liveCost = decimalToNumber(item.product?.cost);
        const effectiveCost = snapshotCost > 0 ? snapshotCost : liveCost > 0 ? liveCost : 0;
        return sum + effectiveCost * decimalToNumber(item.quantity);
      }, 0)
    );

    const grossProfitThisMonth = Math.round(salesThisMonthNet - costOfSalesThisMonth);
    const grossMarginThisMonthPercent = salesThisMonthNet > 0
      ? (grossProfitThisMonth / salesThisMonthNet) * 100
      : 0;

    // === EGRESOS OPERACIONALES (MI CAJA) ===
    const [operationalExpensesTodayData, operationalExpensesThisMonthData] = await Promise.all([
      db.operationalExpense.aggregate({
        where: {
          organizationId,
          expenseDate: {
            gte: startToday,
          },
        },
        _sum: {
          amount: true,
        },
        _count: true,
      }),
      db.operationalExpense.aggregate({
        where: {
          organizationId,
          expenseDate: {
            gte: startThisMonth,
            lte: endThisMonth,
          },
        },
        _sum: {
          amount: true,
        },
        _count: true,
      }),
    ]);

    const operationalExpensesToday = Math.round(
      decimalToNumber(operationalExpensesTodayData._sum.amount)
    );
    const operationalExpensesTodayCount = operationalExpensesTodayData._count;
    const operationalExpensesThisMonth = Math.round(
      decimalToNumber(operationalExpensesThisMonthData._sum.amount)
    );
    const operationalExpensesThisMonthCount = operationalExpensesThisMonthData._count;

    const realProfitToday = grossProfitToday - operationalExpensesToday - cardCommissionsToday;
    const realProfitThisMonth = grossProfitThisMonth - operationalExpensesThisMonth - cardCommissionsThisMonth;
    const realMarginTodayPercent = salesTodayNet > 0 ? (realProfitToday / salesTodayNet) * 100 : 0;
    const realMarginThisMonthPercent = salesThisMonthNet > 0
      ? (realProfitThisMonth / salesThisMonthNet) * 100
      : 0;

    // === CLIENTES ===
    const totalCustomers = await db.customer.count({
      where: { organizationId },
    });

    const newCustomersThisMonth = await db.customer.count({
      where: {
        organizationId,
        createdAt: { gte: startThisMonth },
      },
    });

    const customersWithDebt = await db.customer.count({
      where: {
        organizationId,
        currentDebt: { gt: 0 },
      },
    });

    const accountsReceivableAggregate = await db.customer.aggregate({
      where: {
        organizationId,
        currentDebt: { gt: 0 },
      },
      _sum: {
        currentDebt: true,
      },
    });

    const accountsReceivableTotal = Math.round(decimalToNumber(accountsReceivableAggregate._sum.currentDebt));

    // === COBRANZA Y MOROSIDAD ===
    const overdueNow = new Date();
    const [overdueCreditsCount, overdueCreditsAggregate, paymentsThisMonthAggregate] = await Promise.all([
      db.credit.count({
        where: {
          organizationId,
          balance: { gt: 0 },
          OR: [
            { status: 'OVERDUE' },
            {
              status: 'ACTIVE',
              dueDate: { lt: overdueNow },
            },
          ],
        },
      }),
      db.credit.aggregate({
        where: {
          organizationId,
          balance: { gt: 0 },
          OR: [
            { status: 'OVERDUE' },
            {
              status: 'ACTIVE',
              dueDate: { lt: overdueNow },
            },
          ],
        },
        _sum: {
          balance: true,
        },
      }),
      db.payment.aggregate({
        where: {
          organizationId,
          paidAt: {
            gte: startThisMonth,
            lte: endThisMonth,
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const overdueCreditsBalance = Math.round(decimalToNumber(overdueCreditsAggregate._sum.balance));
    const collectionsThisMonth = Math.round(decimalToNumber(paymentsThisMonthAggregate._sum.amount));

    // === PRODUCTOS ===
    const productCount = await db.product.count({
      where: {
        organizationId,
        isActive: true,
      },
    });

    // === PRODUCTOS CON BAJO STOCK ===
    const lowStockProducts = await db.product.findMany({
      where: {
        organizationId,
        trackInventory: true,
        isActive: true,
        AND: [
          { currentStock: { lte: db.product.fields.minStock } },
        ],
      },
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
        minStock: true,
      },
      take: 10,
    });

    const lowStockCount = lowStockProducts.length;

    // === INVENTARIO: SALUD COMERCIAL ===
    const [productsWithoutSales30dCount, inventoryProductsWithCost] = await Promise.all([
      db.product.count({
        where: {
          organizationId,
          isActive: true,
          type: 'PRODUCT',
          documentItems: {
            none: {
              document: {
                organizationId,
                type: 'SALE',
                status: 'PAID',
                issuedAt: { gte: last30Days },
              },
            },
          },
        },
      }),
      db.product.findMany({
        where: {
          organizationId,
          isActive: true,
          type: 'PRODUCT',
          trackInventory: true,
          cost: { not: null },
        },
        select: {
          currentStock: true,
          cost: true,
        },
      }),
    ]);

    const inventoryValueAtCost = Math.round(
      inventoryProductsWithCost.reduce((sum, product) => {
        return sum + product.currentStock * decimalToNumber(product.cost);
      }, 0)
    );

    // === DOCUMENTOS PENDIENTES ===
    const pendingQuotes = await db.document.count({
      where: {
        organizationId,
        type: 'QUOTE',
        status: { in: ['DRAFT', 'PENDING'] },
      },
    });

    const pendingInvoices = await db.document.count({
      where: {
        organizationId,
        type: 'INVOICE',
        status: { in: ['DRAFT', 'PENDING'] },
      },
    });

    const pendingDocumentsCount = pendingQuotes + pendingInvoices;

    // === TOP 5 PRODUCTOS MÁS VENDIDOS (Últimos 30 días) ===
    const topProductsData = await db.documentItem.groupBy({
      by: ['productId'],
      where: {
        document: {
          organizationId,
          type: 'SALE',
          status: 'PAID',
          issuedAt: {
            gte: currentPeriodStart,
            lte: currentPeriodEnd,
          },
        },
        productId: { not: null },
      },
      _sum: {
        quantity: true,
        total: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    // Obtener nombres de productos
    const topProducts = await Promise.all(
      topProductsData.map(async (item) => {
        const product = await db.product.findUnique({
          where: { id: item.productId! },
          select: { name: true, sku: true },
        });
        const quantitySold = decimalToNumber(item._sum.quantity);
        return {
          productId: item.productId!,
          name: product?.name || 'Producto eliminado',
          productName: product?.name || 'Producto eliminado',
          sku: product?.sku || 'N/A',
          quantitySold,
          quantity: quantitySold,
          revenue: decimalToNumber(item._sum.total),
        };
      })
    );

    // === ACTIVIDAD RECIENTE (Últimas 10 ventas) ===
    const recentSales = await db.document.findMany({
      where: {
        organizationId,
        type: 'SALE',
        status: 'PAID',
      },
      select: {
        id: true,
        type: true,
        docNumber: true,
        total: true,
        paymentMethod: true,
        issuedAt: true,
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        issuedAt: 'desc',
      },
      take: 10,
    });

    const recentSalesFormatted = recentSales.map((sale) => ({
      id: sale.id,
      type: sale.type,
      docNumber: sale.docNumber,
      documentNumber: sale.docNumber,
      customerName: sale.customer?.name || null,
      total: decimalToNumber(sale.total),
      paymentMethod: sale.paymentMethod,
      issuedAt: sale.issuedAt.toISOString(),
      createdAt: sale.issuedAt.toISOString(),
    }));

    // === MÉTRICAS DE PROYECTOS (solo si módulo activo) ===
    let projectKpis: {
      totalProjects: number;
      activeProjects: number;
      onHoldProjects: number;
      completedProjects: number;
      cancelledProjects: number;
      overBudgetProjects: number;
      milestonesTotal: number;
      milestonesCompleted: number;
      milestonesOverdue: number;
      milestoneProgressPercent: number;
      budgetTotal: number;
      actualCostTotal: number;
      budgetVariance: number;
      budgetUsagePercent: number;
      approvedQuotes: number;
      convertedProjects: number;
      quoteToProjectConversionPercent: number;
      statusDistribution: Array<{ status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'; total: number }>;
    } | null = null;

    if (hasProjectsModule) {
      const now = new Date();

      const [
        projectsByStatus,
        projectsAggregate,
        overBudgetProjects,
        milestonesTotal,
        milestonesCompleted,
        milestonesOverdue,
        approvedQuotes,
        convertedProjects,
      ] = await Promise.all([
        db.project.groupBy({
          by: ['status'],
          where: { organizationId },
          _count: true,
        }),
        db.project.aggregate({
          where: { organizationId },
          _sum: {
            budget: true,
            actualCost: true,
          },
          _count: true,
        }),
        db.project.count({
          where: {
            organizationId,
            budget: { not: null },
            actualCost: { gt: db.project.fields.budget },
          },
        }),
        db.projectMilestone.count({
          where: { organizationId },
        }),
        db.projectMilestone.count({
          where: {
            organizationId,
            isCompleted: true,
          },
        }),
        db.projectMilestone.count({
          where: {
            organizationId,
            isCompleted: false,
            dueDate: { lt: now },
          },
        }),
        db.document.count({
          where: {
            organizationId,
            type: 'QUOTE',
            status: 'APPROVED',
          },
        }),
        db.project.count({
          where: {
            organizationId,
            quoteId: { not: null },
          },
        }),
      ]);

      const statusCountMap: Record<'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED', number> = {
        ACTIVE: 0,
        ON_HOLD: 0,
        COMPLETED: 0,
        CANCELLED: 0,
      };

      const statusCounts = projectsByStatus.reduce(
        (acc, item) => {
          if (item.status in acc) {
            acc[item.status as keyof typeof acc] = item._count;
          }
          return acc;
        },
        { ...statusCountMap }
      );

      const budgetTotal = decimalToNumber(projectsAggregate._sum.budget);
      const actualCostTotal = decimalToNumber(projectsAggregate._sum.actualCost);
      const budgetVariance = actualCostTotal - budgetTotal;
      const budgetUsagePercent = budgetTotal > 0 ? (actualCostTotal / budgetTotal) * 100 : 0;
      const milestoneProgressPercent = milestonesTotal > 0 ? (milestonesCompleted / milestonesTotal) * 100 : 0;
      const quoteToProjectConversionPercent = approvedQuotes > 0
        ? (convertedProjects / approvedQuotes) * 100
        : 0;

      projectKpis = {
        totalProjects: projectsAggregate._count,
        activeProjects: statusCounts.ACTIVE,
        onHoldProjects: statusCounts.ON_HOLD,
        completedProjects: statusCounts.COMPLETED,
        cancelledProjects: statusCounts.CANCELLED,
        overBudgetProjects,
        milestonesTotal,
        milestonesCompleted,
        milestonesOverdue,
        milestoneProgressPercent: Math.round(milestoneProgressPercent * 10) / 10,
        budgetTotal: Math.round(budgetTotal),
        actualCostTotal: Math.round(actualCostTotal),
        budgetVariance: Math.round(budgetVariance),
        budgetUsagePercent: Math.round(budgetUsagePercent * 10) / 10,
        approvedQuotes,
        convertedProjects,
        quoteToProjectConversionPercent: Math.round(quoteToProjectConversionPercent * 10) / 10,
        statusDistribution: [
          { status: 'ACTIVE', total: statusCounts.ACTIVE },
          { status: 'ON_HOLD', total: statusCounts.ON_HOLD },
          { status: 'COMPLETED', total: statusCounts.COMPLETED },
          { status: 'CANCELLED', total: statusCounts.CANCELLED },
        ],
      };
    }

    // === DISTRIBUCIÓN DE MÉTODOS DE PAGO (Últimos 30 días) ===
    const paymentMethodsData = await db.document.groupBy({
      by: ['paymentMethod'],
      where: {
        organizationId,
        type: 'SALE',
        status: 'PAID',
        issuedAt: {
          gte: currentPeriodStart,
          lte: currentPeriodEnd,
        },
      },
      _sum: {
        total: true,
      },
      _count: true,
    });

    const paymentMethodsDistribution = paymentMethodsData.reduce((acc, item) => {
      acc[item.paymentMethod] = {
        count: item._count,
        total: decimalToNumber(item._sum.total),
      };
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    const paymentMethodsEntries = Object.entries(paymentMethodsDistribution);
    const totalPaymentsSales30d = paymentMethodsEntries.reduce((sum, [, value]) => sum + value.total, 0);
    const cashSales30d = paymentMethodsDistribution.CASH?.total ?? 0;
    const cashSharePercent = totalPaymentsSales30d > 0 ? (cashSales30d / totalPaymentsSales30d) * 100 : 0;
    const topPaymentMethodEntry = paymentMethodsEntries.sort((a, b) => b[1].total - a[1].total)[0];
    const topPaymentMethod = topPaymentMethodEntry
      ? {
          method: topPaymentMethodEntry[0],
          total: Math.round(topPaymentMethodEntry[1].total),
          count: topPaymentMethodEntry[1].count,
        }
      : null;

    // === INDICADORES ZIMPLE (ACCIÓN) ===
    const avgTicketThisMonth = salesThisMonthCount > 0 ? salesThisMonthTotal / salesThisMonthCount : 0;
    const stockRiskPercent = productCount > 0 ? (lowStockCount / productCount) * 100 : 0;
    const creditExposurePercent = salesThisMonthTotal > 0 ? (accountsReceivableTotal / salesThisMonthTotal) * 100 : 0;

    const zimpleActionItems: string[] = [];

    if (salesThisMonthItemsWithoutCost > 0) {
      zimpleActionItems.push('Completa costos de productos para medir margen real sin sesgo.');
    }

    if (overdueCreditsCount > 0) {
      zimpleActionItems.push('Prioriza cobranza: tienes créditos vencidos activos.');
    }

    if (lowStockCount > 0) {
      zimpleActionItems.push('Repón productos críticos para evitar quiebres de stock.');
    }

    if (productsWithoutSales30dCount > 0) {
      zimpleActionItems.push('Revisa productos sin rotación en 30 días para liberar capital.');
    }

    if (cashSharePercent > 70) {
      zimpleActionItems.push('Alta dependencia de efectivo: incentiva medios electrónicos para reducir riesgo.');
    }

    // === VENTAS DEL PERÍODO ACTIVO (para gráfico) ===
    const salesPeriodData = await db.document.groupBy({
      by: ['issuedAt'],
      where: {
        organizationId,
        type: 'SALE',
        status: 'PAID',
        issuedAt: {
          gte: currentPeriodStart,
          lte: currentPeriodEnd,
        },
      },
      _sum: {
        total: true,
      },
    });

    // Agrupar por día (ignorando hora)
    const salesByDay = salesPeriodData.reduce((acc, item) => {
      const dateKey = item.issuedAt.toISOString().split('T')[0]; // YYYY-MM-DD
      const existing = acc[dateKey] || 0;
      acc[dateKey] = existing + decimalToNumber(item._sum.total);
      return acc;
    }, {} as Record<string, number>);

    // Preparar datos para gráfico (asegurar que todos los días del período estén presentes)
    const periodDaysArray: Date[] = [];
    const cursor = new Date(currentPeriodStart);
    while (cursor <= currentPeriodEnd) {
      periodDaysArray.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const salesChartData = periodDaysArray.map((date) => {
      const dateKey = date.toISOString().split('T')[0];
      return {
        date: dateKey,
        total: salesByDay[dateKey] || 0,
      };
    });

    // === RESULTADO REAL DEL PERÍODO ACTIVO ===
    const [salesDocsPeriod, salesItemsPeriod, operationalExpensesPeriod, cardCommissionsPeriodData] = await Promise.all([
      db.document.findMany({
        where: {
          organizationId,
          type: 'SALE',
          status: 'PAID',
          issuedAt: {
            gte: currentPeriodStart,
            lte: currentPeriodEnd,
          },
        },
        select: {
          issuedAt: true,
          subtotal: true,
        },
      }),
      db.documentItem.findMany({
        where: {
          document: {
            organizationId,
            type: 'SALE',
            status: 'PAID',
              issuedAt: {
                gte: currentPeriodStart,
                lte: currentPeriodEnd,
              },
          },
        },
        select: {
          quantity: true,
          document: {
            select: {
              issuedAt: true,
            },
          },
          product: {
            select: {
              cost: true,
            },
          },
        },
      }),
      db.operationalExpense.findMany({
        where: {
          organizationId,
          expenseDate: {
            gte: currentPeriodStart,
            lte: currentPeriodEnd,
          },
        },
        select: {
          expenseDate: true,
          amount: true,
        },
      }),
      db.$queryRaw<Array<{ date: Date; total: Prisma.Decimal | number | null }>>(Prisma.sql`
        SELECT DATE(issued_at) AS date, COALESCE(SUM(card_commission_amount), 0) AS total
        FROM documents
        WHERE organization_id = ${organizationId}
          AND type = 'SALE'
          AND status = 'PAID'
          AND payment_method = 'CARD'
          AND issued_at >= ${currentPeriodStart}
          AND issued_at <= ${currentPeriodEnd}
        GROUP BY DATE(issued_at)
      `),
    ]);

    const netSalesByDay: Record<string, number> = {};
    for (const document of salesDocsPeriod) {
      const dateKey = document.issuedAt.toISOString().split('T')[0];
      netSalesByDay[dateKey] = (netSalesByDay[dateKey] || 0) + decimalToNumber(document.subtotal);
    }

    const costByDay: Record<string, number> = {};
    for (const item of salesItemsPeriod) {
      const dateKey = item.document.issuedAt.toISOString().split('T')[0];
      const quantity = decimalToNumber(item.quantity);
      const unitCost = decimalToNumber(item.product?.cost);
      costByDay[dateKey] = (costByDay[dateKey] || 0) + quantity * unitCost;
    }

    const operationalExpensesByDay: Record<string, number> = {};
    for (const expense of operationalExpensesPeriod) {
      const dateKey = expense.expenseDate.toISOString().split('T')[0];
      operationalExpensesByDay[dateKey] =
        (operationalExpensesByDay[dateKey] || 0) + decimalToNumber(expense.amount);
    }

    const cardCommissionsByDay: Record<string, number> = {};
    for (const row of cardCommissionsPeriodData) {
      const dateKey = row.date.toISOString().split('T')[0];
      cardCommissionsByDay[dateKey] = decimalToNumber(row.total);
    }

    const realResultChartData = periodDaysArray.map((date) => {
      const dateKey = date.toISOString().split('T')[0];
      const netSales = Math.round(netSalesByDay[dateKey] || 0);
      const costOfSales = Math.round(costByDay[dateKey] || 0);
      const operationalExpenses = Math.round(operationalExpensesByDay[dateKey] || 0);
      const cardCommissions = Math.round(cardCommissionsByDay[dateKey] || 0);
      const totalCost = costOfSales + operationalExpenses + cardCommissions;
      const realProfit = netSales - totalCost;
      const realMarginPercent = netSales > 0 ? (realProfit / netSales) * 100 : 0;

      return {
        date: dateKey,
        netSales,
        costOfSales,
        operationalExpenses,
        cardCommissions,
        totalCost,
        realProfit,
        realMarginPercent: Math.round(realMarginPercent * 10) / 10,
      };
    });

    // === MOTORES CONTABLES DUALES (Sprint 2) ===
    // Se ejecutan en paralelo con el período activo seleccionado por el usuario.
    const [periodManagementMetrics, periodCashFlowMetrics, periodExposureMetrics] = await Promise.all([
      calculateManagementMetrics(organizationId, currentPeriodStart, currentPeriodEnd),
      calculateCashFlowMetrics(organizationId, currentPeriodStart, currentPeriodEnd),
      calculateExposureMetrics(organizationId, currentPeriodStart, currentPeriodEnd),
    ]);

    // === RESPUESTA FINAL ===
    return NextResponse.json({
      // Ventas
      salesToday: {
        total: Math.round(salesTodayTotal),
        net: Math.round(salesTodayNet),
        taxableBaseBeforeGlobalDiscount: Math.round(salesTodayTaxableBaseBeforeGlobalDiscount),
        globalDiscount: Math.round(salesTodayGlobalDiscount),
        tax: Math.round(salesTodayTax),
        count: salesTodayCount,
        avgTicket: Math.round(avgTicketToday),
      },
      salesYesterday: {
        total: Math.round(salesYesterdayTotal),
      },
      salesGrowthVsYesterday: Math.round(salesGrowthVsYesterday * 10) / 10,
      salesThisMonth: {
        total: Math.round(salesThisMonthTotal),
        net: Math.round(salesThisMonthNet),
        taxableBaseBeforeGlobalDiscount: Math.round(salesThisMonthTaxableBaseBeforeGlobalDiscount),
        globalDiscount: Math.round(salesThisMonthGlobalDiscount),
        tax: Math.round(salesThisMonthTax),
        count: salesThisMonthCount,
      },
      salesLastMonth: {
        total: Math.round(salesLastMonthTotal),
      },
      salesAllTime: {
        total: Math.round(salesAllTimeTotal),
        count: salesAllTimeCount,
      },
      salesGrowthVsLastMonth: Math.round(salesGrowthVsLastMonth * 10) / 10,

      periodContext: {
        key: period,
        label: periodLabelMap[period],
        compareLabel: compareLabelMap[period],
        currentRange: {
          start: currentPeriodStart.toISOString(),
          end: currentPeriodEnd.toISOString(),
        },
        previousRange: {
          start: previousPeriodStart.toISOString(),
          end: previousPeriodEnd.toISOString(),
        },
      },

      periodSummary: {
        current: {
          sales: {
            total: Math.round(periodSalesCurrent.total),
            net: Math.round(periodSalesCurrent.net),
            tax: Math.round(periodSalesCurrent.tax),
            discount: Math.round(periodSalesCurrent.globalDiscount),
            count: periodSalesCurrent.count,
            avgTicket: Math.round(periodSalesCurrent.avgTicket),
          },
          financials: periodFinancialCurrent,
        },
        previous: {
          sales: {
            total: Math.round(periodSalesPrevious.total),
            net: Math.round(periodSalesPrevious.net),
            tax: Math.round(periodSalesPrevious.tax),
            discount: Math.round(periodSalesPrevious.globalDiscount),
            count: periodSalesPrevious.count,
            avgTicket: Math.round(periodSalesPrevious.avgTicket),
          },
          financials: periodFinancialPrevious,
        },
        growthVsPrevious: Math.round(periodGrowthVsPrevious * 10) / 10,
      },

      // Clientes
      totalCustomers,
      newCustomersThisMonth,
      customersWithDebt,
      accountsReceivable: {
        total: accountsReceivableTotal,
        count: customersWithDebt,
      },

      // Finanzas Zimple
      financials: {
        today: {
          grossSales: Math.round(salesTodayTotal),
          netSales: Math.round(salesTodayNet),
          taxableBaseBeforeGlobalDiscount: Math.round(salesTodayTaxableBaseBeforeGlobalDiscount),
          globalDiscount: Math.round(salesTodayGlobalDiscount),
          taxAmount: Math.round(salesTodayTax),
          costOfSales: costOfSalesToday,
          grossProfit: grossProfitToday,
          operationalExpenses: operationalExpensesToday,
          cardCommissions: cardCommissionsToday,
          operationalExpensesCount: operationalExpensesTodayCount,
          realProfit: realProfitToday,
          grossMarginPercent: Math.round(grossMarginTodayPercent * 10) / 10,
          realMarginPercent: Math.round(realMarginTodayPercent * 10) / 10,
          itemsWithoutCost: salesTodayItemsWithoutCost,
          costCoveragePercent: salesTodayItems.length > 0
            ? Math.round((salesTodayItemsWithCost.length / salesTodayItems.length) * 1000) / 10
            : 100,
        },
        thisMonth: {
          grossSales: Math.round(salesThisMonthTotal),
          netSales: Math.round(salesThisMonthNet),
          taxableBaseBeforeGlobalDiscount: Math.round(salesThisMonthTaxableBaseBeforeGlobalDiscount),
          globalDiscount: Math.round(salesThisMonthGlobalDiscount),
          taxAmount: Math.round(salesThisMonthTax),
          costOfSales: costOfSalesThisMonth,
          grossProfit: grossProfitThisMonth,
          operationalExpenses: operationalExpensesThisMonth,
          cardCommissions: cardCommissionsThisMonth,
          operationalExpensesCount: operationalExpensesThisMonthCount,
          realProfit: realProfitThisMonth,
          grossMarginPercent: Math.round(grossMarginThisMonthPercent * 10) / 10,
          realMarginPercent: Math.round(realMarginThisMonthPercent * 10) / 10,
          itemsWithoutCost: salesThisMonthItemsWithoutCost,
          costCoveragePercent: salesThisMonthItems.length > 0
            ? Math.round((salesThisMonthItemsWithCost.length / salesThisMonthItems.length) * 1000) / 10
            : 100,
        },
      },

      // Productos
      productCount,
      lowStockProducts: {
        count: lowStockCount,
        products: lowStockProducts,
      },

      // Documentos pendientes
      pendingDocuments: {
        count: pendingDocumentsCount,
        byType: {
          quotes: pendingQuotes,
          invoices: pendingInvoices,
        },
      },

      // Top productos
      topProducts,

      // Actividad reciente
      recentSales: recentSalesFormatted,

      // Métodos de pago
      paymentMethodsDistribution,
      paymentInsights: {
        topMethod: topPaymentMethod,
        cashSharePercent: Math.round(cashSharePercent * 10) / 10,
      },

      // Indicadores Zimple (comercio)
      zimpleIndicators: {
        avgTicketThisMonth: Math.round(avgTicketThisMonth),
        collectionsThisMonth,
        overdueCreditsCount,
        overdueCreditsBalance,
        stockRiskPercent: Math.round(stockRiskPercent * 10) / 10,
        productsWithoutSales30dCount,
        inventoryValueAtCost,
        creditExposurePercent: Math.round(creditExposurePercent * 10) / 10,
        operationalExpensesThisMonth,
        cardCommissionsThisMonth,
        realProfitThisMonth,
        actionItems: zimpleActionItems,
      },

      // Datos para gráficos
      salesChartData,
      realResultChartData,

      // ─── Motores Contables Duales (Sprint 2) ──────────────────────────────
      // managementMetrics: Rentabilidad real (Devengado). Márgenes y COGS exactos.
      // cashFlowMetrics: Flujo de Caja (Percibido). Liquidez real 14 D3/D8.
      // Ambos aplican al período activo seleccionado (hoy / semana / mes / trimestre).
      managementMetrics: periodManagementMetrics,
      cashFlowMetrics: periodCashFlowMetrics,

      // ─── Motor 3: Exposición de Cartera (Sprint 6) ───────────────────────────
      // receivables: CxC activa (total, vencida, por vencer, eficiencia, top deudores)
      // payables:   CxP pendiente (total, vencida, por vencer, top proveedores)
      // treasury:   Saldo estimado histórico (INFLOW – OUTFLOW en Tesorería)
      receivables: periodExposureMetrics.receivables,
      payables: periodExposureMetrics.payables,
      treasury: periodExposureMetrics.treasury,

      // Módulos y métricas de proyectos
      hasProjectsModule,
      projectKpis,
    });
  } catch (error) {
    console.error('Error al obtener KPIs del dashboard:', error);
    return NextResponse.json(
      { error: 'Error al calcular métricas del dashboard' },
      { status: 500 }
    );
  }
}
