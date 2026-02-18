import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Parámetros startDate y endDate son requeridos' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const [sales, operationalExpenses, collections] = await Promise.all([
      db.document.findMany({
        where: {
          organizationId: organization.id,
          type: 'SALE',
          status: 'PAID',
          issuedAt: {
            gte: start,
            lte: end,
          },
        },
        select: {
          id: true,
          docNumber: true,
          issuedAt: true,
          paymentMethod: true,
          cardType: true,
          cardCommissionAmount: true,
          subtotal: true,
          taxAmount: true,
          discount: true,
          total: true,
          customer: {
            select: {
              name: true,
              rut: true,
            },
          },
        },
        orderBy: {
          issuedAt: 'asc',
        },
      }),
      db.operationalExpense.findMany({
        where: {
          organizationId: organization.id,
          expenseDate: {
            gte: start,
            lte: end,
          },
        },
        select: {
          id: true,
          title: true,
          category: true,
          amount: true,
          paymentMethod: true,
          expenseDate: true,
          cashRegisterId: true,
        },
        orderBy: {
          expenseDate: 'asc',
        },
      }),
      db.payment.findMany({
        where: {
          organizationId: organization.id,
          paidAt: {
            gte: start,
            lte: end,
          },
        },
        select: {
          id: true,
          amount: true,
          paymentMethod: true,
          paidAt: true,
          customer: {
            select: {
              name: true,
              rut: true,
            },
          },
          credit: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          paidAt: 'asc',
        },
      }),
    ]);

    const saleIds = sales.map((sale) => sale.id);
    const saleItems = saleIds.length > 0
      ? await db.documentItem.findMany({
          where: {
            documentId: { in: saleIds },
          },
          select: {
            documentId: true,
            quantity: true,
            product: {
              select: {
                cost: true,
              },
            },
          },
        })
      : [];

    const costByDocumentId = saleItems.reduce((acc, item) => {
      const quantity = Number(item.quantity);
      const unitCost = Number(item.product?.cost || 0);
      acc[item.documentId] = (acc[item.documentId] || 0) + (quantity * unitCost);
      return acc;
    }, {} as Record<string, number>);

    const formattedSales = sales.map((sale) => {
      const subtotal = Number(sale.subtotal);
      const cardCommissionAmount = Number(sale.cardCommissionAmount || 0);
      const costOfSales = costByDocumentId[sale.id] || 0;
      const finalProfit = subtotal - costOfSales - cardCommissionAmount;
      const finalMarginPercent = subtotal > 0 ? (finalProfit / subtotal) * 100 : 0;

      return {
        id: sale.id,
        documentNumber: sale.docNumber,
        issuedAt: sale.issuedAt.toISOString(),
        paymentMethod: sale.paymentMethod,
        cardType: sale.cardType,
        cardCommissionAmount,
        customerName: sale.customer?.name || 'Público general',
        customerRut: sale.customer?.rut || '',
        subtotal,
        taxAmount: Number(sale.taxAmount),
        discount: Number(sale.discount),
        total: Number(sale.total),
        costOfSales,
        finalProfit,
        finalMarginPercent: Math.round(finalMarginPercent * 10) / 10,
      };
    });

    const subtotalTotal = formattedSales.reduce((acc, sale) => acc + sale.subtotal, 0);
    const finalProfitTotal = formattedSales.reduce((acc, sale) => acc + sale.finalProfit, 0);
    const totalSalesAmount = formattedSales.reduce((acc, sale) => acc + sale.total, 0);
    const creditSalesTotal = formattedSales
      .filter((sale) => sale.paymentMethod === 'CREDIT')
      .reduce((acc, sale) => acc + sale.total, 0);
    const immediateCashSalesTotal = totalSalesAmount - creditSalesTotal;
    const creditSalesCount = formattedSales.filter((sale) => sale.paymentMethod === 'CREDIT').length;

    const formattedOperationalExpenses = operationalExpenses.map((expense) => ({
      id: expense.id,
      title: expense.title,
      category: expense.category || 'Sin categoría',
      amount: Number(expense.amount),
      paymentMethod: expense.paymentMethod,
      expenseDate: expense.expenseDate.toISOString(),
      cashRegisterId: expense.cashRegisterId,
    }));

    const formattedCollections = collections.map((payment) => ({
      id: payment.id,
      creditId: payment.credit.id,
      amount: Number(payment.amount),
      paymentMethod: payment.paymentMethod,
      paidAt: payment.paidAt.toISOString(),
      customerName: payment.customer?.name || 'Cliente',
      customerRut: payment.customer?.rut || '',
    }));

    const operationalExpensesTotal = formattedOperationalExpenses.reduce(
      (acc, expense) => acc + expense.amount,
      0
    );
    const collectionsTotal = formattedCollections.reduce((acc, payment) => acc + payment.amount, 0);
    const operatingResultAfterExpenses = finalProfitTotal - operationalExpensesTotal;
    const cashInflowsTotal = immediateCashSalesTotal + collectionsTotal;
    const cashOutflowsTotal = operationalExpensesTotal;
    const consolidatedCashFlow = cashInflowsTotal - cashOutflowsTotal;

    return NextResponse.json({
      sales: formattedSales,
      operationalExpenses: formattedOperationalExpenses,
      collections: formattedCollections,
      summary: {
        salesCount: formattedSales.length,
        subtotal: subtotalTotal,
        taxAmount: formattedSales.reduce((acc, sale) => acc + sale.taxAmount, 0),
        discount: formattedSales.reduce((acc, sale) => acc + sale.discount, 0),
        cardCommissionAmount: formattedSales.reduce((acc, sale) => acc + sale.cardCommissionAmount, 0),
        costOfSales: formattedSales.reduce((acc, sale) => acc + sale.costOfSales, 0),
        finalProfit: finalProfitTotal,
        finalMarginPercent: subtotalTotal > 0 ? Math.round((finalProfitTotal / subtotalTotal) * 1000) / 10 : 0,
        total: totalSalesAmount,
        creditSalesCount,
        creditSalesTotal,
        immediateCashSalesTotal,
        operationalExpensesCount: formattedOperationalExpenses.length,
        operationalExpensesTotal,
        collectionsCount: formattedCollections.length,
        collectionsTotal,
        cashInflowsTotal,
        cashOutflowsTotal,
        operatingResultAfterExpenses,
        consolidatedCashFlow,
      },
    });
  } catch (error) {
    console.error('Error al obtener detalle mensual de ventas:', error);
    return NextResponse.json(
      { error: 'Error al obtener detalle mensual de ventas' },
      { status: 500 }
    );
  }
}