import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { db } from '@/lib/db';
import { CHILE_TIMEZONE, decimalToNumber } from '@/lib/utils/dashboard-helpers';

interface MonthRange {
  startDate: Date;
  endDate: Date;
  monthKey: string;
  monthLabel: string;
}

interface SalesDocument {
  id: string;
  paymentMethod: string;
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  cardCommissionAmount: number;
}

interface AccountingTreasuryFilters {
  treasuryCategory?:
    | 'CAPITAL_INJECTION'
    | 'OWNER_WITHDRAWAL'
    | 'LOAN_IN'
    | 'LOAN_OUT'
    | 'ACCOUNT_PAYABLE_PAYMENT'
    | 'OTHER';
  treasurySource?: 'CASH' | 'BANK' | 'TRANSFER' | 'OTHER';
}

export interface AccountingMonthlySummary {
  month: string;
  monthLabel: string;
  salesCount: number;
  salesTotal: number;
  salesNet: number;
  salesTax: number;
  salesDiscount: number;
  creditSalesTotal: number;
  immediateCashSalesTotal: number;
  cardCommissionsTotal: number;
  costOfSalesTotal: number;
  grossProfit: number;
  collectionsCount: number;
  collectionsTotal: number;
  projectCollectionsCount: number;
  projectCollectionsTotal: number;
  treasuryInflowsTotal: number;
  treasuryOutflowsTotal: number;
  treasuryMovementsCount: number;
  operationalExpensesCount: number;
  operationalExpensesTotal: number;
  projectExpensesCount: number;
  projectExpensesTotal: number;
  projectResourcesCount: number;
  projectResourcesTotal: number;
  projectOutflowsTotal: number;
  cashInflowsTotal: number;
  cashOutflowsTotal: number;
  netCashFlow: number;
  operatingResult: number;
  grossMarginPercent: number;
  operatingMarginPercent: number;
  warnings: string[];
}

export interface AccountingBalanceSnapshot {
  month: string;
  monthLabel: string;
  assets: {
    cashFlowMonth: number;
    customerAccountsReceivable: number;
    projectAccountsReceivable: number;
    accountsReceivable: number;
    inventoryAtCost: number;
    total: number;
  };
  liabilities: {
    accountsPayable: number;
    total: number;
  };
  equity: {
    netPosition: number;
  };
  context: {
    customersWithDebt: number;
    projectsWithPendingCollection: number;
    payablesPendingCount: number;
    productsValuedCount: number;
  };
  warnings: string[];
}

export interface AccountingSeriesPoint {
  month: string;
  monthLabel: string;
  netCashFlow: number;
  operatingResult: number;
  cashInflowsTotal: number;
  cashOutflowsTotal: number;
}

function getMonthRange(month?: string): MonthRange {
  if (month) {
    const [yearStr, monthStr] = month.split('-');
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;
    const baseDate = new Date(year, monthIndex, 1);

    return {
      startDate: startOfMonth(baseDate),
      endDate: endOfMonth(baseDate),
      monthKey: format(baseDate, 'yyyy-MM'),
      monthLabel: baseDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }),
    };
  }

  const zonedNow = toZonedTime(new Date(), CHILE_TIMEZONE);
  return {
    startDate: startOfMonth(zonedNow),
    endDate: endOfMonth(zonedNow),
    monthKey: format(zonedNow, 'yyyy-MM'),
    monthLabel: zonedNow.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }),
  };
}

async function getSalesDocuments(organizationId: string, startDate: Date, endDate: Date): Promise<SalesDocument[]> {
  const documents = await db.document.findMany({
    where: {
      organizationId,
      type: 'SALE',
      status: 'PAID',
      issuedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      paymentMethod: true,
      subtotal: true,
      taxAmount: true,
      discount: true,
      total: true,
      cardCommissionAmount: true,
    },
  });

  return documents.map((document) => ({
    id: document.id,
    paymentMethod: document.paymentMethod,
    subtotal: decimalToNumber(document.subtotal),
    taxAmount: decimalToNumber(document.taxAmount),
    discount: decimalToNumber(document.discount),
    total: decimalToNumber(document.total),
    cardCommissionAmount: decimalToNumber(document.cardCommissionAmount),
  }));
}

async function getCostOfSalesByDocument(organizationId: string, startDate: Date, endDate: Date): Promise<Record<string, number>> {
  const saleItems = await db.documentItem.findMany({
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
      documentId: true,
      quantity: true,
      product: {
        select: {
          cost: true,
        },
      },
    },
  });

  return saleItems.reduce((acc, item) => {
    const quantity = decimalToNumber(item.quantity);
    const cost = decimalToNumber(item.product?.cost);
    acc[item.documentId] = (acc[item.documentId] || 0) + quantity * cost;
    return acc;
  }, {} as Record<string, number>);
}

export async function buildAccountingMonthlySummary(
  organizationId: string,
  month?: string,
  treasuryFilters?: AccountingTreasuryFilters
): Promise<AccountingMonthlySummary> {
  const { startDate, endDate, monthKey, monthLabel } = getMonthRange(month);
  const treasuryWhereBase = {
    organizationId,
    ...(treasuryFilters?.treasuryCategory ? { category: treasuryFilters.treasuryCategory } : {}),
    ...(treasuryFilters?.treasurySource ? { source: treasuryFilters.treasurySource } : {}),
  };

  const [
    sales,
    costByDocument,
    collectionsAgg,
    projectCollectionsAgg,
    treasuryInflowsAgg,
    treasuryOutflowsAgg,
    opExpensesAgg,
    projectExpensesAgg,
    projectResourcesAgg,
  ] =
    await Promise.all([
      getSalesDocuments(organizationId, startDate, endDate),
      getCostOfSalesByDocument(organizationId, startDate, endDate),
      db.payment.aggregate({
        where: {
          organizationId,
          paidAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
      db.projectPayment.aggregate({
        where: {
          organizationId,
          paidAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
      db.treasuryMovement.aggregate({
        where: {
          ...treasuryWhereBase,
          type: 'INFLOW',
          occurredAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
      db.treasuryMovement.aggregate({
        where: {
          ...treasuryWhereBase,
          type: 'OUTFLOW',
          occurredAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
      db.operationalExpense.aggregate({
        where: {
          organizationId,
          expenseDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
      db.projectExpense.aggregate({
        where: {
          organizationId,
          expenseDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
      db.projectResource.aggregate({
        where: {
          organizationId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: { totalCost: true },
        _count: true,
      }),
    ]);

  const salesCount = sales.length;
  const salesTotal = Math.round(sales.reduce((acc, sale) => acc + sale.total, 0));
  const salesNet = Math.round(sales.reduce((acc, sale) => acc + sale.subtotal, 0));
  const salesTax = Math.round(sales.reduce((acc, sale) => acc + sale.taxAmount, 0));
  const salesDiscount = Math.round(sales.reduce((acc, sale) => acc + sale.discount, 0));
  const creditSalesTotal = Math.round(
    sales.filter((sale) => sale.paymentMethod === 'CREDIT').reduce((acc, sale) => acc + sale.total, 0)
  );
  const immediateCashSalesTotal = Math.round(salesTotal - creditSalesTotal);
  const cardCommissionsTotal = Math.round(sales.reduce((acc, sale) => acc + sale.cardCommissionAmount, 0));
  const costOfSalesTotal = Math.round(
    sales.reduce((acc, sale) => acc + (costByDocument[sale.id] || 0), 0)
  );

  const grossProfit = Math.round(salesNet - costOfSalesTotal - cardCommissionsTotal);

  const collectionsTotal = Math.round(decimalToNumber(collectionsAgg._sum.amount));
  const collectionsCount = collectionsAgg._count;
  const projectCollectionsTotal = Math.round(decimalToNumber(projectCollectionsAgg._sum.amount));
  const projectCollectionsCount = projectCollectionsAgg._count;
  const treasuryInflowsTotal = Math.round(decimalToNumber(treasuryInflowsAgg._sum.amount));
  const treasuryOutflowsTotal = Math.round(decimalToNumber(treasuryOutflowsAgg._sum.amount));
  const treasuryMovementsCount = treasuryInflowsAgg._count + treasuryOutflowsAgg._count;

  const operationalExpensesTotal = Math.round(decimalToNumber(opExpensesAgg._sum.amount));
  const operationalExpensesCount = opExpensesAgg._count;

  const projectExpensesTotal = Math.round(decimalToNumber(projectExpensesAgg._sum.amount));
  const projectExpensesCount = projectExpensesAgg._count;

  const projectResourcesTotal = Math.round(decimalToNumber(projectResourcesAgg._sum.totalCost));
  const projectResourcesCount = projectResourcesAgg._count;

  const projectOutflowsTotal = Math.round(projectExpensesTotal + projectResourcesTotal);

  const cashInflowsTotal = Math.round(
    immediateCashSalesTotal + collectionsTotal + projectCollectionsTotal + treasuryInflowsTotal
  );
  const cashOutflowsTotal = Math.round(
    operationalExpensesTotal + projectOutflowsTotal + treasuryOutflowsTotal
  );
  const netCashFlow = Math.round(cashInflowsTotal - cashOutflowsTotal);
  const operatingResult = Math.round(
    grossProfit + projectCollectionsTotal - operationalExpensesTotal - projectOutflowsTotal
  );

  const warnings: string[] = [];
  if (creditSalesTotal > 0) {
    warnings.push('Las ventas a crédito se reconocen en flujo solo al cobrarse (no al emitirse).');
  }
  if (projectCollectionsTotal > 0) {
    warnings.push('Los ingresos de proyecto se reconocen solo por cobros efectivamente registrados.');
  }
  if (projectOutflowsTotal > 0 && projectCollectionsTotal === 0) {
    warnings.push('Existen egresos de proyectos sin cobros de proyecto en el período.');
  }
  if (treasuryMovementsCount > 0) {
    warnings.push('Los movimientos de tesorería impactan flujo de caja, pero no el resultado operativo.');
  }

  return {
    month: monthKey,
    monthLabel,
    salesCount,
    salesTotal,
    salesNet,
    salesTax,
    salesDiscount,
    creditSalesTotal,
    immediateCashSalesTotal,
    cardCommissionsTotal,
    costOfSalesTotal,
    grossProfit,
    collectionsCount,
    collectionsTotal,
    projectCollectionsCount,
    projectCollectionsTotal,
    treasuryInflowsTotal,
    treasuryOutflowsTotal,
    treasuryMovementsCount,
    operationalExpensesCount,
    operationalExpensesTotal,
    projectExpensesCount,
    projectExpensesTotal,
    projectResourcesCount,
    projectResourcesTotal,
    projectOutflowsTotal,
    cashInflowsTotal,
    cashOutflowsTotal,
    netCashFlow,
    operatingResult,
    grossMarginPercent: salesNet > 0 ? Math.round((grossProfit / salesNet) * 1000) / 10 : 0,
    operatingMarginPercent: salesNet > 0 ? Math.round((operatingResult / salesNet) * 1000) / 10 : 0,
    warnings,
  };
}

export async function buildAccountingBalanceSnapshot(
  organizationId: string,
  month?: string,
  treasuryFilters?: AccountingTreasuryFilters
): Promise<AccountingBalanceSnapshot> {
  const monthly = await buildAccountingMonthlySummary(organizationId, month, treasuryFilters);

  const [receivablesAgg, payablesAgg, productsWithCost, projects] = await Promise.all([
    db.customer.aggregate({
      where: {
        organizationId,
        currentDebt: { gt: 0 },
      },
      _sum: { currentDebt: true },
      _count: true,
    }),
    db.accountPayable.aggregate({
      where: {
        organizationId,
        balance: { gt: 0 },
        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
      },
      _sum: { balance: true },
      _count: true,
    }),
    db.product.findMany({
      where: {
        organizationId,
        type: 'PRODUCT',
        isActive: true,
        trackInventory: true,
        cost: { not: null },
      },
      select: {
        currentStock: true,
        cost: true,
      },
    }),
    db.project.findMany({
      where: {
        organizationId,
        status: { not: 'CANCELLED' },
      },
      select: {
        contractedAmount: true,
        quote: {
          select: {
            total: true,
          },
        },
        payments: {
          select: {
            amount: true,
          },
        },
      },
    }),
  ]);

  const customerAccountsReceivable = Math.round(decimalToNumber(receivablesAgg._sum.currentDebt));
  const accountsPayable = Math.round(decimalToNumber(payablesAgg._sum.balance));
  const inventoryAtCost = Math.round(
    productsWithCost.reduce((acc, product) => acc + product.currentStock * decimalToNumber(product.cost), 0)
  );

  const { projectAccountsReceivable, projectsWithPendingCollection } = projects.reduce(
    (acc, project) => {
      const contractedAmount = project.contractedAmount !== null
        ? decimalToNumber(project.contractedAmount)
        : decimalToNumber(project.quote?.total);

      if (!contractedAmount || contractedAmount <= 0) {
        return acc;
      }

      const collectedAmount = project.payments.reduce(
        (sum, payment) => sum + decimalToNumber(payment.amount),
        0
      );

      const pending = Math.max(contractedAmount - collectedAmount, 0);
      if (pending > 0) {
        acc.projectAccountsReceivable += pending;
        acc.projectsWithPendingCollection += 1;
      }

      return acc;
    },
    { projectAccountsReceivable: 0, projectsWithPendingCollection: 0 }
  );

  const projectAccountsReceivableRounded = Math.round(projectAccountsReceivable);
  const accountsReceivable = Math.round(customerAccountsReceivable + projectAccountsReceivableRounded);

  const assets = {
    cashFlowMonth: monthly.netCashFlow,
    customerAccountsReceivable,
    projectAccountsReceivable: projectAccountsReceivableRounded,
    accountsReceivable,
    inventoryAtCost,
    total: Math.round(monthly.netCashFlow + accountsReceivable + inventoryAtCost),
  };

  const liabilities = {
    accountsPayable,
    total: accountsPayable,
  };

  return {
    month: monthly.month,
    monthLabel: monthly.monthLabel,
    assets,
    liabilities,
    equity: {
      netPosition: Math.round(assets.total - liabilities.total),
    },
    context: {
      customersWithDebt: receivablesAgg._count,
      projectsWithPendingCollection,
      payablesPendingCount: payablesAgg._count,
      productsValuedCount: productsWithCost.length,
    },
    warnings: [
      'Caja en balance se representa como flujo neto del período (aproximación Zimple).',
      'CxC incluye deuda de clientes y saldo pendiente de cobro de proyectos.',
    ],
  };
}

export async function buildAccountingSeries(
  organizationId: string,
  months: number,
  treasuryFilters?: AccountingTreasuryFilters
): Promise<AccountingSeriesPoint[]> {
  const now = toZonedTime(new Date(), CHILE_TIMEZONE);
  const monthStarts = Array.from({ length: months }, (_, index) =>
    startOfMonth(subMonths(now, months - index - 1))
  );

  const series = await Promise.all(
    monthStarts.map((monthStart) =>
      buildAccountingMonthlySummary(
        organizationId,
        format(monthStart, 'yyyy-MM'),
        treasuryFilters
      )
    )
  );

  return series.map((item) => ({
    month: item.month,
    monthLabel: item.monthLabel,
    netCashFlow: item.netCashFlow,
    operatingResult: item.operatingResult,
    cashInflowsTotal: item.cashInflowsTotal,
    cashOutflowsTotal: item.cashOutflowsTotal,
  }));
}
