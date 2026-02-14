import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import {
  getStartOfToday,
  getStartOfYesterday,
  getStartOfThisMonth,
  getEndOfThisMonth,
  getStartOfLastMonth,
  getEndOfLastMonth,
  getDaysAgo,
  decimalToNumber,
  calculateGrowth,
} from '@/lib/utils/dashboard-helpers';

/**
 * GET /api/dashboard/kpis
 * Retorna métricas calculadas del dashboard para la organización actual
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

    const organizationId = organization.id;

    // Fechas de referencia
    const startToday = getStartOfToday();
    const startYesterday = getStartOfYesterday();
    const startThisMonth = getStartOfThisMonth();
    const endThisMonth = getEndOfThisMonth();
    const startLastMonth = getStartOfLastMonth();
    const endLastMonth = getEndOfLastMonth();
    const last30Days = getDaysAgo(30);
    const last7Days = getDaysAgo(7);

    // === VENTAS DEL DÍA ===
    const salesTodayData = await db.document.aggregate({
      where: {
        organizationId,
        type: 'SALE',
        status: 'PAID',
        issuedAt: { gte: startToday },
      },
      _sum: { total: true },
      _count: true,
    });

    const salesTodayTotal = decimalToNumber(salesTodayData._sum.total);
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
      _sum: { total: true },
      _count: true,
    });

    const salesThisMonthTotal = decimalToNumber(salesThisMonthData._sum.total);
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
          issuedAt: { gte: last30Days },
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
        return {
          productId: item.productId!,
          name: product?.name || 'Producto eliminado',
          sku: product?.sku || 'N/A',
          quantitySold: decimalToNumber(item._sum.quantity),
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
      docNumber: sale.docNumber,
      customerName: sale.customer?.name || null,
      total: decimalToNumber(sale.total),
      paymentMethod: sale.paymentMethod,
      issuedAt: sale.issuedAt.toISOString(),
    }));

    // === DISTRIBUCIÓN DE MÉTODOS DE PAGO (Últimos 30 días) ===
    const paymentMethodsData = await db.document.groupBy({
      by: ['paymentMethod'],
      where: {
        organizationId,
        type: 'SALE',
        status: 'PAID',
        issuedAt: { gte: last30Days },
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

    // === VENTAS ÚLTIMOS 7 DÍAS (para gráfico) ===
    const salesLast7DaysData = await db.document.groupBy({
      by: ['issuedAt'],
      where: {
        organizationId,
        type: 'SALE',
        status: 'PAID',
        issuedAt: { gte: last7Days },
      },
      _sum: {
        total: true,
      },
    });

    // Agrupar por día (ignorando hora)
    const salesByDay = salesLast7DaysData.reduce((acc, item) => {
      const dateKey = item.issuedAt.toISOString().split('T')[0]; // YYYY-MM-DD
      const existing = acc[dateKey] || 0;
      acc[dateKey] = existing + decimalToNumber(item._sum.total);
      return acc;
    }, {} as Record<string, number>);

    // Preparar datos para gráfico (asegurar que todos los días estén presentes)
    const last7DaysArray: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      last7DaysArray.push(getDaysAgo(i));
    }

    const salesChartData = last7DaysArray.map((date) => {
      const dateKey = date.toISOString().split('T')[0];
      return {
        date: dateKey,
        total: salesByDay[dateKey] || 0,
      };
    });

    // === RESPUESTA FINAL ===
    return NextResponse.json({
      // Ventas
      salesToday: {
        total: Math.round(salesTodayTotal),
        count: salesTodayCount,
        avgTicket: Math.round(avgTicketToday),
      },
      salesYesterday: {
        total: Math.round(salesYesterdayTotal),
      },
      salesGrowthVsYesterday: Math.round(salesGrowthVsYesterday * 10) / 10,
      salesThisMonth: {
        total: Math.round(salesThisMonthTotal),
        count: salesThisMonthCount,
      },
      salesLastMonth: {
        total: Math.round(salesLastMonthTotal),
      },
      salesGrowthVsLastMonth: Math.round(salesGrowthVsLastMonth * 10) / 10,

      // Clientes
      totalCustomers,
      newCustomersThisMonth,
      customersWithDebt,

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

      // Datos para gráficos
      salesChartData,
    });
  } catch (error) {
    console.error('Error al obtener KPIs del dashboard:', error);
    return NextResponse.json(
      { error: 'Error al calcular métricas del dashboard' },
      { status: 500 }
    );
  }
}
