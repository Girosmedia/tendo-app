import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Users, 
  Package, 
  AlertCircle,
  FileText,
  ArrowUp,
  ArrowDown,
  Gauge,
  Wallet,
  ShieldAlert,
  Boxes,
  Clock,
  CheckCircle2,
  Building2,
  BadgeAlert,
  Landmark,
} from 'lucide-react';
import { formatCurrency, formatPercentage, formatDateRange } from '@/lib/utils/dashboard-helpers';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Garantiza que el dashboard nunca sea servido desde caché estático de Next.js.
// Las ventas del período deben reflejarse en tiempo real al cargar/recargar la página.
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { ProjectsStatusChart } from '@/app/dashboard/_components/projects-status-chart';
import { DashboardZimpleCharts } from '@/app/dashboard/_components/dashboard-zimple-charts';
import { SetupChecklist } from '@/app/dashboard/_components/setup-checklist';
import { KpiCard } from '@/app/dashboard/_components/kpi-card';
import { DashboardPeriodSelector, type DashboardPeriod } from '@/app/dashboard/_components/dashboard-period-selector';

interface TopProduct {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
}

interface RecentSale {
  id: string;
  type: 'SALE' | 'QUOTE' | 'INVOICE' | 'RECEIPT' | 'CREDIT_NOTE';
  documentNumber: number;
  customerName: string | null;
  total: number;
  createdAt: string;
}

interface ProjectKpis {
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
  statusDistribution: Array<{
    status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
    total: number;
  }>;
}

interface FinancialMetrics {
  grossSales: number;
  netSales: number;
  taxableBaseBeforeGlobalDiscount: number;
  globalDiscount: number;
  taxAmount: number;
  costOfSales: number;
  grossProfit: number;
  operationalExpenses: number;
  cardCommissions: number;
  operationalExpensesCount: number;
  realProfit: number;
  grossMarginPercent: number;
  realMarginPercent: number;
  itemsWithoutCost: number;
  costCoveragePercent: number;
}

interface ZimpleIndicators {
  avgTicketThisMonth: number;
  collectionsThisMonth: number;
  overdueCreditsCount: number;
  overdueCreditsBalance: number;
  stockRiskPercent: number;
  productsWithoutSales30dCount: number;
  inventoryValueAtCost: number;
  creditExposurePercent: number;
  operationalExpensesThisMonth: number;
  cardCommissionsThisMonth: number;
  realProfitThisMonth: number;
  actionItems: string[];
}

interface ManagementMetrics {
  revenueNet: number;
  cogs: number;
  grossMargin: number;
  grossMarginPct: number;
  costCoveragePct: number;
  itemsWithoutCost: number;
  warnings: string[];
}

interface CashFlowMetrics {
  cashInflows: number;
  cashOutflows: number;
  netCashFlow: number;
  creditSalesPending: number;
}

interface ReceivablesMetrics {
  totalActive: number;
  overdue: number;
  dueSoon: number;
  /** Créditos emitidos en el período activo */
  emittedThisPeriod: number;
  /** Pagos cobrados en el período activo */
  collectedThisPeriod: number;
  collectionEfficiencyPct: number | null;
  topDebtors: Array<{ customerId: string; customerName: string; balance: number }>;
}

interface PayablesMetrics {
  totalPending: number;
  overdue: number;
  dueSoon: number;
  /** Pagos realizados a proveedores en el período activo */
  paidThisPeriod: number;
  topSuppliers: Array<{ supplierId: string; supplierName: string; balance: number }>;
}

interface TreasuryPosition {
  estimatedBalance: number;
}

const VALID_PERIODS: DashboardPeriod[] = ['today', 'week', 'month', 'last_month', 'quarter'];

async function getDashboardKPIs(period: DashboardPeriod = 'month') {
  try {
    const headersList = await headers();
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/dashboard/kpis?period=${period}`, {
      cache: 'no-store', // Sin caché: siempre datos frescos; caja abierta debe reflejarse de inmediato
      headers: {
        Cookie: headersList.get('cookie') || '',
      },
    });
    
    if (!res.ok) {
      console.error('Error fetching KPIs:', await res.text());
      return null;
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error in getDashboardKPIs:', error);
    return null;
  }
}

export default async function DashboardPage(
  props: { searchParams: Promise<{ period?: string }> }
) {
  const searchParams = await props.searchParams;
  const rawPeriod = searchParams.period ?? 'month';
  const period: DashboardPeriod = VALID_PERIODS.includes(rawPeriod as DashboardPeriod)
    ? (rawPeriod as DashboardPeriod)
    : 'month';

  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (!session.user.organizationId && !session.user.isSuperAdmin) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">No perteneces a ninguna organización</h2>
          <p className="mt-2 text-muted-foreground">
            Contacta a tu administrador para que te agregue a una organización.
          </p>
        </div>
      </div>
    );
  }

  const kpisData = await getDashboardKPIs(period);
  
  if (!kpisData) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error al cargar datos
            </CardTitle>
            <CardDescription>
              No se pudieron obtener las métricas del negocio. Por favor, intenta recargar la página.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Estructurar datos del API
  const sales = {
    today: {
      total: kpisData.salesToday?.total || 0,
      count: kpisData.salesToday?.count || 0,
      avgTicket: kpisData.salesToday?.avgTicket || 0,
      growthVsYesterday: kpisData.salesGrowthVsYesterday || 0,
    },
    thisMonth: {
      total: kpisData.salesThisMonth?.total || 0,
      net: kpisData.salesThisMonth?.net || 0,
      tax: kpisData.salesThisMonth?.tax || 0,
      count: kpisData.salesThisMonth?.count || 0,
      growthVsLastMonth: kpisData.salesGrowthVsLastMonth || 0,
    },
    allTime: {
      total: kpisData.salesAllTime?.total || 0,
      count: kpisData.salesAllTime?.count || 0,
    },
  };

  const financials: {
    today: FinancialMetrics;
    thisMonth: FinancialMetrics;
  } = {
    today: {
      grossSales: kpisData.financials?.today?.grossSales || 0,
      netSales: kpisData.financials?.today?.netSales || 0,
      taxableBaseBeforeGlobalDiscount:
        kpisData.financials?.today?.taxableBaseBeforeGlobalDiscount || 0,
      globalDiscount: kpisData.financials?.today?.globalDiscount || 0,
      taxAmount: kpisData.financials?.today?.taxAmount || 0,
      costOfSales: kpisData.financials?.today?.costOfSales || 0,
      grossProfit: kpisData.financials?.today?.grossProfit || 0,
      operationalExpenses: kpisData.financials?.today?.operationalExpenses || 0,
      cardCommissions: kpisData.financials?.today?.cardCommissions || 0,
      operationalExpensesCount: kpisData.financials?.today?.operationalExpensesCount || 0,
      realProfit: kpisData.financials?.today?.realProfit || 0,
      grossMarginPercent: kpisData.financials?.today?.grossMarginPercent || 0,
      realMarginPercent: kpisData.financials?.today?.realMarginPercent || 0,
      itemsWithoutCost: kpisData.financials?.today?.itemsWithoutCost || 0,
      costCoveragePercent: kpisData.financials?.today?.costCoveragePercent || 100,
    },
    thisMonth: {
      grossSales: kpisData.financials?.thisMonth?.grossSales || 0,
      netSales: kpisData.financials?.thisMonth?.netSales || 0,
      taxableBaseBeforeGlobalDiscount:
        kpisData.financials?.thisMonth?.taxableBaseBeforeGlobalDiscount || 0,
      globalDiscount: kpisData.financials?.thisMonth?.globalDiscount || 0,
      taxAmount: kpisData.financials?.thisMonth?.taxAmount || 0,
      costOfSales: kpisData.financials?.thisMonth?.costOfSales || 0,
      grossProfit: kpisData.financials?.thisMonth?.grossProfit || 0,
      operationalExpenses: kpisData.financials?.thisMonth?.operationalExpenses || 0,
      cardCommissions: kpisData.financials?.thisMonth?.cardCommissions || 0,
      operationalExpensesCount: kpisData.financials?.thisMonth?.operationalExpensesCount || 0,
      realProfit: kpisData.financials?.thisMonth?.realProfit || 0,
      grossMarginPercent: kpisData.financials?.thisMonth?.grossMarginPercent || 0,
      realMarginPercent: kpisData.financials?.thisMonth?.realMarginPercent || 0,
      itemsWithoutCost: kpisData.financials?.thisMonth?.itemsWithoutCost || 0,
      costCoveragePercent: kpisData.financials?.thisMonth?.costCoveragePercent || 100,
    },
  };

  const customers = {
    total: kpisData.totalCustomers || 0,
    newThisMonth: kpisData.newCustomersThisMonth || 0,
    withDebt: kpisData.customersWithDebt || 0,
  };

  const products = {
    count: kpisData.productCount || 0,
    lowStockCount: kpisData.lowStockProducts?.count || 0,
    lowStockProducts: kpisData.lowStockProducts?.products || [],
  };

  const documents = {
    pendingQuotes: kpisData.pendingDocuments?.byType?.quotes || 0,
    pendingInvoices: kpisData.pendingDocuments?.byType?.invoices || 0,
  };

  const accountsReceivable = {
    total: kpisData.accountsReceivable?.total || 0,
    count: kpisData.accountsReceivable?.count || 0,
  };

  const paymentInsights = {
    topMethod: kpisData.paymentInsights?.topMethod || null,
    cashSharePercent: kpisData.paymentInsights?.cashSharePercent || 0,
  };

  const zimpleIndicators: ZimpleIndicators = {
    avgTicketThisMonth: kpisData.zimpleIndicators?.avgTicketThisMonth || 0,
    collectionsThisMonth: kpisData.zimpleIndicators?.collectionsThisMonth || 0,
    overdueCreditsCount: kpisData.zimpleIndicators?.overdueCreditsCount || 0,
    overdueCreditsBalance: kpisData.zimpleIndicators?.overdueCreditsBalance || 0,
    stockRiskPercent: kpisData.zimpleIndicators?.stockRiskPercent || 0,
    productsWithoutSales30dCount: kpisData.zimpleIndicators?.productsWithoutSales30dCount || 0,
    inventoryValueAtCost: kpisData.zimpleIndicators?.inventoryValueAtCost || 0,
    creditExposurePercent: kpisData.zimpleIndicators?.creditExposurePercent || 0,
    operationalExpensesThisMonth: kpisData.zimpleIndicators?.operationalExpensesThisMonth || 0,
    cardCommissionsThisMonth: kpisData.zimpleIndicators?.cardCommissionsThisMonth || 0,
    realProfitThisMonth: kpisData.zimpleIndicators?.realProfitThisMonth || 0,
    actionItems: kpisData.zimpleIndicators?.actionItems || [],
  };

  const managementMetrics: ManagementMetrics = {
    revenueNet:        kpisData.managementMetrics?.revenueNet      ?? 0,
    cogs:              kpisData.managementMetrics?.cogs             ?? 0,
    grossMargin:       kpisData.managementMetrics?.grossMargin      ?? 0,
    grossMarginPct:    kpisData.managementMetrics?.grossMarginPct   ?? 0,
    costCoveragePct:   kpisData.managementMetrics?.costCoveragePct  ?? 100,
    itemsWithoutCost:  kpisData.managementMetrics?.itemsWithoutCost ?? 0,
    warnings:          kpisData.managementMetrics?.warnings         ?? [],
  };

  const cashFlowMetrics: CashFlowMetrics = {
    cashInflows:          kpisData.cashFlowMetrics?.cashInflows          ?? 0,
    cashOutflows:         kpisData.cashFlowMetrics?.cashOutflows         ?? 0,
    netCashFlow:          kpisData.cashFlowMetrics?.netCashFlow          ?? 0,
    creditSalesPending:   kpisData.cashFlowMetrics?.creditSalesPending   ?? 0,
  };

  const receivables: ReceivablesMetrics = {
    totalActive:             kpisData.receivables?.totalActive             ?? 0,
    overdue:                 kpisData.receivables?.overdue                 ?? 0,
    dueSoon:                 kpisData.receivables?.dueSoon                 ?? 0,
    emittedThisPeriod:       kpisData.receivables?.emittedThisPeriod       ?? 0,
    collectedThisPeriod:     kpisData.receivables?.collectedThisPeriod     ?? 0,
    collectionEfficiencyPct: kpisData.receivables?.collectionEfficiencyPct ?? null,
    topDebtors:              kpisData.receivables?.topDebtors              ?? [],
  };

  const payables: PayablesMetrics = {
    totalPending:   kpisData.payables?.totalPending   ?? 0,
    overdue:        kpisData.payables?.overdue        ?? 0,
    dueSoon:        kpisData.payables?.dueSoon        ?? 0,
    paidThisPeriod: kpisData.payables?.paidThisPeriod ?? 0,
    topSuppliers:   kpisData.payables?.topSuppliers   ?? [],
  };

  const treasury: TreasuryPosition = {
    estimatedBalance: kpisData.treasury?.estimatedBalance ?? 0,
  };

  const topProducts: TopProduct[] = kpisData.topProducts || [];
  const recentSales: RecentSale[] = kpisData.recentSales || [];
  const hasProjectsModule = Boolean(kpisData.hasProjectsModule);
  const projectKpis: ProjectKpis | null = kpisData.projectKpis || null;

  const salesTrend = (kpisData.salesChartData || []).map((item: { date: string; total: number }) => ({
    dateLabel: new Date(item.date).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
    }),
    total: item.total || 0,
  }));

  const paymentMethodLabelMap: Record<string, string> = {
    CASH: 'Efectivo',
    CARD: 'Tarjeta',
    TRANSFER: 'Transferencia',
    CREDIT: 'Crédito',
    CHECK: 'Cheque',
    MULTI: 'Mixto',
  };

  const paymentMix = Object.entries(kpisData.paymentMethodsDistribution || {}).map(([method, value]) => ({
    method,
    label: paymentMethodLabelMap[method] || method,
    total: (value as { total: number }).total || 0,
  }));

  const realResultTrend = (kpisData.realResultChartData || []).map(
    (item: {
      date: string;
      netSales: number;
      costOfSales: number;
      operationalExpenses: number;
      cardCommissions: number;
      totalCost: number;
      realProfit: number;
      realMarginPercent: number;
    }) => ({
      dateLabel: new Date(item.date).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
      }),
      netSales: item.netSales || 0,
      costOfSales: item.costOfSales || 0,
      operationalExpenses: item.operationalExpenses || 0,
      cardCommissions: item.cardCommissions || 0,
      totalCost: item.totalCost || 0,
      realProfit: item.realProfit || 0,
      realMarginPercent: item.realMarginPercent || 0,
    })
  );

  const activeFinancialPreview: FinancialMetrics = kpisData.periodSummary?.current?.financials ?? financials.thisMonth;

  const marginComponent = Math.max(0, Math.min(100, activeFinancialPreview.realMarginPercent * 2));
  const coverageComponent = Math.max(0, Math.min(100, activeFinancialPreview.costCoveragePercent));
  const stockComponent = Math.max(0, 100 - zimpleIndicators.stockRiskPercent * 2);
  const debtComponent = Math.max(0, 100 - zimpleIndicators.creditExposurePercent);

  const businessHealthScore = Math.round(
    marginComponent * 0.35 +
    coverageComponent * 0.25 +
    stockComponent * 0.2 +
    debtComponent * 0.2
  );

  const businessHealthLabel =
    businessHealthScore >= 80
      ? 'Saludable'
      : businessHealthScore >= 60
        ? 'Atención'
        : 'Crítico';

  const businessHealthClass =
    businessHealthScore >= 80
      ? 'text-success'
      : businessHealthScore >= 60
        ? 'text-warning'
        : 'text-destructive';

  const periodContext = kpisData.periodContext ?? {
    key: period,
    label: period === 'today' ? 'Hoy' : period === 'week' ? 'Esta semana' : period === 'last_month' ? 'Mes anterior' : period === 'quarter' ? 'Este trimestre' : 'Este mes',
    compareLabel: period === 'today' ? 'ayer' : period === 'week' ? 'semana anterior' : period === 'last_month' ? 'mes previo' : period === 'quarter' ? 'trimestre anterior' : 'mes anterior',
  };

  const periodSummary = kpisData.periodSummary;
  const activeSales = periodSummary?.current?.sales ?? {
    total: sales.thisMonth.total,
    net: sales.thisMonth.net,
    tax: sales.thisMonth.tax,
    count: sales.thisMonth.count,
    avgTicket: zimpleIndicators.avgTicketThisMonth,
  };
  const previousSales = periodSummary?.previous?.sales ?? {
    total: kpisData.salesLastMonth?.total ?? 0,
    net: 0,
    tax: 0,
    count: 0,
    avgTicket: 0,
  };

  const activeFinancials: FinancialMetrics = periodSummary?.current?.financials ?? financials.thisMonth;
  const previousFinancials: FinancialMetrics = periodSummary?.previous?.financials ?? {
    ...financials.thisMonth,
    grossSales: 0,
    netSales: 0,
    taxableBaseBeforeGlobalDiscount: 0,
    globalDiscount: 0,
    taxAmount: 0,
    costOfSales: 0,
    grossProfit: 0,
    operationalExpenses: 0,
    cardCommissions: 0,
    operationalExpensesCount: 0,
    realProfit: 0,
    grossMarginPercent: 0,
    realMarginPercent: 0,
    itemsWithoutCost: 0,
    costCoveragePercent: 100,
  };

  const periodLabelMap: Record<DashboardPeriod, string> = {
    today:      'Hoy',
    week:       'Esta semana',
    month:      'Este mes',
    last_month: 'Mes anterior',
    quarter:    'Este trimestre',
  };

  const hasSalesHistory = sales.allTime.count > 0;
  const hasSelectedMonthlyData = activeSales.total > 0;

  const marginCoverageAlert = activeFinancials.costCoveragePercent < 90;
  const marginCoverageLabel = marginCoverageAlert
    ? `Cobertura de costos incompleta (${formatPercentage(activeFinancials.costCoveragePercent)})`
    : `Cobertura de costos ${formatPercentage(activeFinancials.costCoveragePercent)}`;

  // Comparación de margen bruto (grossProfit = ventas netas − COGS).
  // Se usa grossProfit y NO realProfit porque los gastos operativos (arriendo, sueldos, etc.)
  // se registran en fechas puntuales y distorsionan la comparación entre períodos cortos (hoy/semana).
  // Ejemplo: un gasto mensual registrado el martes de la semana pasada haría que esa semana
  // muestre un resultado neto masivamente negativo, aunque las ventas fueran buenas.
  const grossProfitDelta = activeFinancials.grossProfit - (previousFinancials.grossProfit || 0);
  const netSalesDelta = activeSales.net - (previousSales.net || 0);
  const avgTicketDelta = activeSales.avgTicket - (previousSales.avgTicket || 0);

  return (
    <div className='space-y-4 md:space-y-6'>
      <div className='flex items-start justify-between gap-3'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>Dashboard Comercial</h1>
          <p className='text-sm text-muted-foreground md:text-base'>
            Entiende tu negocio en segundos: caja, rentabilidad, cobranza e inventario.
          </p>
        </div>
        <DashboardPeriodSelector value={period} />
      </div>

      {/* Checklist de activación para organizaciones nuevas */}
      <SetupChecklist />

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-12'>
        <Card className='lg:col-span-12'>
          <CardHeader className='pb-3'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <div>
                <CardTitle className='text-base md:text-lg'>Panel Ejecutivo</CardTitle>
                <CardDescription>
                  Resumen del período{' '}
                  <span className='font-medium text-foreground'>{periodContext.label}</span>
                  {periodContext.currentRange && (
                    <span className='text-muted-foreground/80'>
                      {' '}({formatDateRange(periodContext.currentRange.start, periodContext.currentRange.end)})
                    </span>
                  )}
                  {' '}vs {periodContext.compareLabel}
                </CardDescription>
              </div>
              <div className='flex flex-wrap items-center gap-2 text-xs'>
                {/* Badge contextual: ventas del día cuando se navega otro período */}
                {period !== 'today' && sales.today.total > 0 && (
                  <span className='rounded-full border border-dashed px-2 py-1 text-muted-foreground' title='Ventas registradas hoy (incluye caja abierta)'>
                    Hoy: {formatCurrency(sales.today.total)}
                  </span>
                )}
                <span className='rounded-full border px-2 py-1'>Ventas netas: {formatCurrency(activeSales.net)}</span>
                <span className='rounded-full border px-2 py-1'>Margen bruto: {formatCurrency(managementMetrics.grossMargin)} ({formatPercentage(managementMetrics.grossMarginPct)})</span>
                <span className={`rounded-full border px-2 py-1 ${activeFinancials.realProfit < 0 ? 'border-destructive/40 text-destructive' : ''}`}>Resultado neto: {formatCurrency(activeFinancials.realProfit)}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'>
              <div className='rounded-lg border p-3 space-y-1'>
                <p className='text-xs text-muted-foreground'>
                  Ventas netas del período
                  {periodContext.currentRange && (
                    <span className='ml-1 font-normal text-[10px] text-muted-foreground/70'>
                      ({formatDateRange(periodContext.currentRange.start, periodContext.currentRange.end)})
                    </span>
                  )}
                </p>
                <p className='text-2xl font-semibold'>{formatCurrency(activeSales.net)}</p>
                <p className={`text-xs font-medium ${netSalesDelta >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {netSalesDelta >= 0 ? '+' : ''}{formatCurrency(netSalesDelta)} vs {periodContext.compareLabel}
                </p>
              </div>

              <div className='rounded-lg border p-3 space-y-1'>
                <p className='text-xs text-muted-foreground'>Margen bruto del período</p>
                <p className={`text-2xl font-semibold ${activeFinancials.grossProfit < 0 ? 'text-destructive' : ''}`}>
                  {formatCurrency(activeFinancials.grossProfit)}
                </p>
                <p className={`text-xs font-medium ${grossProfitDelta >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {grossProfitDelta >= 0 ? '+' : ''}{formatCurrency(grossProfitDelta)} vs {periodContext.compareLabel}
                </p>
                {/* Egresos: siempre visibles como contexto para no ocultar la realidad */}
                {activeFinancials.operationalExpenses > 0 ? (
                  <p className='text-[10px] text-muted-foreground'>
                    Egresos período: −{formatCurrency(activeFinancials.operationalExpenses)}
                    {' → '}Resultado neto: {formatCurrency(activeFinancials.realProfit)}
                  </p>
                ) : (
                  <p className='text-[10px] text-muted-foreground'>Sin egresos operativos registrados</p>
                )}
              </div>

              <div className='rounded-lg border p-3 space-y-1'>
                <p className='text-xs text-muted-foreground'>Ticket promedio</p>
                <p className='text-2xl font-semibold'>{formatCurrency(activeSales.avgTicket)}</p>
                <p className={`text-xs font-medium ${avgTicketDelta >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {avgTicketDelta >= 0 ? '+' : ''}{formatCurrency(avgTicketDelta)} vs {periodContext.compareLabel}
                </p>
              </div>

              <div className='rounded-lg border p-3 space-y-1'>
                <p className='text-xs text-muted-foreground'>Calidad de margen</p>
                <p className='text-2xl font-semibold'>{formatPercentage(activeFinancials.realMarginPercent)}</p>
                <p className={`text-xs font-medium ${marginCoverageAlert ? 'text-warning' : 'text-success'}`}>
                  {marginCoverageLabel}
                </p>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 xl:grid-cols-8'>
              <div className='rounded-md border bg-muted/30 p-2'>
                <p className='text-muted-foreground'>Ventas brutas</p>
                <p className='font-semibold'>{formatCurrency(activeSales.total)}</p>
              </div>
              <div className='rounded-md border bg-muted/30 p-2'>
                <p className='text-muted-foreground'>IVA</p>
                <p className='font-semibold'>{formatCurrency(activeFinancials.taxAmount)}</p>
              </div>
              <div className='rounded-md border bg-muted/30 p-2'>
                <p className='text-muted-foreground'>Costos</p>
                <p className='font-semibold'>{formatCurrency(activeFinancials.costOfSales)}</p>
              </div>
              <div className='rounded-md border bg-muted/30 p-2'>
                <p className='text-muted-foreground'>Egresos</p>
                <p className='font-semibold'>{formatCurrency(activeFinancials.operationalExpenses)}</p>
              </div>
              <div className='rounded-md border bg-muted/30 p-2'>
                <p className='text-muted-foreground'>Comisiones</p>
                <p className='font-semibold'>{formatCurrency(activeFinancials.cardCommissions)}</p>
              </div>
              <div className='rounded-md border bg-muted/30 p-2'>
                <p className='text-muted-foreground'>Clientes con deuda</p>
                <p className='font-semibold'>{customers.withDebt}</p>
              </div>
              <div className='rounded-md border bg-muted/30 p-2'>
                <p className='text-muted-foreground'>CxC total</p>
                <p className='font-semibold'>{formatCurrency(accountsReceivable.total)}</p>
              </div>
              <div className='rounded-md border bg-muted/30 p-2'>
                <p className='text-muted-foreground'>Stock riesgo</p>
                <p className='font-semibold'>{formatPercentage(zimpleIndicators.stockRiskPercent)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Motor de Rentabilidad (Devengado) ─────────────────── */}
      {hasSelectedMonthlyData && (
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-12'>
          <Card className='lg:col-span-12'>
            <CardHeader className='pb-3'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <div>
                  <CardTitle className='flex items-center gap-2 text-base md:text-lg'>
                    <BarChart3 className='h-4 w-4 text-primary' />
                    Rentabilidad de Ventas
                  </CardTitle>
                  <CardDescription>
                    Motor <span className='font-medium text-foreground'>Devengado</span> — ingresos reconocidos al emitir el documento, independiente del cobro
                  </CardDescription>
                </div>
                {managementMetrics.itemsWithoutCost > 0 && (
                  <div className='flex items-center gap-1.5 rounded-full border border-warning/50 bg-warning/10 px-3 py-1 text-xs text-warning'>
                    <AlertCircle className='h-3.5 w-3.5' />
                    {managementMetrics.itemsWithoutCost} ítem{managementMetrics.itemsWithoutCost > 1 ? 's' : ''} sin costo registrado
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 gap-3 xl:grid-cols-4'>
                <KpiCard
                  title='Ingresos netos'
                  value={formatCurrency(managementMetrics.revenueNet)}
                  periodLabel={periodContext.label}
                  description='Suma de subtotales (sin IVA) de todos los documentos de venta emitidos en el período, incluyendo ventas al crédito. Base del motor devengado.'
                  icon={TrendingUp}
                />
                <KpiCard
                  title='Costo de ventas'
                  value={formatCurrency(managementMetrics.cogs)}
                  periodLabel={periodContext.label}
                  description='Costo histórico de los productos vendidos (snapshot unitCost al momento de la venta). Refleja el costo real, no el precio de lista actual.'
                  icon={Package}
                />
                <KpiCard
                  title='Margen bruto'
                  value={formatCurrency(managementMetrics.grossMargin)}
                  periodLabel={periodContext.label}
                  subValue={formatPercentage(managementMetrics.grossMarginPct)}
                  description='Ingresos netos menos costo de ventas. Mide cuánto queda de cada peso vendido antes de gastos operacionales.'
                  icon={DollarSign}
                />
                <KpiCard
                  title='Cobertura de costos'
                  value={formatPercentage(managementMetrics.costCoveragePct)}
                  periodLabel={periodContext.label}
                  description='Porcentaje de ítems vendidos que tienen costo registrado. 100% = margen confiable. Menos del 90% indica que el margen puede estar sobreestimado.'
                  icon={Gauge}
                  alert={managementMetrics.costCoveragePct < 90 ? `${managementMetrics.itemsWithoutCost} ítems sin costo` : undefined}
                  alertVariant={managementMetrics.costCoveragePct < 90 ? 'warning' : undefined}
                />
              </div>
              {managementMetrics.warnings.length > 0 && (
                <div className='mt-3 flex flex-col gap-1.5'>
                  {managementMetrics.warnings.map((w, i) => (
                    <div key={i} className='flex items-start gap-2 rounded-md border border-warning/40 bg-warning/5 px-3 py-2 text-xs text-warning'>
                      <AlertCircle className='mt-0.5 h-3.5 w-3.5 shrink-0' />
                      {w}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Flujo de Caja 14 D3 (Percibido) + Salud del Negocio ── */}
      {hasSelectedMonthlyData && (
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-12'>
          <Card className='lg:col-span-8'>
            <CardHeader className='pb-3'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <div>
                  <CardTitle className='flex items-center gap-2 text-base md:text-lg'>
                    <Activity className='h-4 w-4 text-primary' />
                    Flujo de Caja
                  </CardTitle>
                  <CardDescription>
                    Motor <span className='font-medium text-foreground'>Percibido (14 D3)</span> — dinero efectivamente recibido y pagado en el período
                  </CardDescription>
                </div>
                {cashFlowMetrics.creditSalesPending > 0 && (
                  <div className='flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs text-primary'>
                    <TrendingDown className='h-3.5 w-3.5' />
                    {formatCurrency(cashFlowMetrics.creditSalesPending)} en ventas crédito pendientes de cobro
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 gap-3 xl:grid-cols-4'>
                <KpiCard
                  title='Entradas de caja'
                  value={formatCurrency(cashFlowMetrics.cashInflows)}
                  periodLabel={periodContext.label}
                  description='Pagos efectivamente recibidos en el período: cobros directos en ventas y abonos a créditos. NO incluye ventas al crédito sin cobrar.'
                  icon={ArrowUp}
                />
                <KpiCard
                  title='Salidas de caja'
                  value={formatCurrency(cashFlowMetrics.cashOutflows)}
                  periodLabel={periodContext.label}
                  description='Egresos efectivos del período: gastos operacionales + movimientos de tesorería tipo OUTFLOW.'
                  icon={ArrowDown}
                />
                <KpiCard
                  title='Flujo neto'
                  value={formatCurrency(cashFlowMetrics.netCashFlow)}
                  periodLabel={periodContext.label}
                  description='Entradas menos salidas de caja. Positivo = caja crece. Negativo = caja se contrae. Base del informe 14 D3 para el SII.'
                  icon={Wallet}
                  alert={cashFlowMetrics.netCashFlow < 0 ? 'Flujo negativo en el período' : undefined}
                  alertVariant={cashFlowMetrics.netCashFlow < 0 ? 'destructive' : undefined}
                />
                <KpiCard
                  title='CxC pendiente'
                  value={formatCurrency(cashFlowMetrics.creditSalesPending)}
                  periodLabel={periodContext.label}
                  description='Ventas al crédito emitidas en el período que aún no han sido pagadas. Este monto está en el motor devengado pero no en el percibido.'
                  icon={ShieldAlert}
                  alert={cashFlowMetrics.creditSalesPending > 0 ? 'Por cobrar' : undefined}
                  alertVariant={cashFlowMetrics.creditSalesPending > 0 ? 'warning' : undefined}
                />
              </div>
              {treasury.estimatedBalance !== 0 && (
                <div className='mt-4 flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3'>
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <Landmark className='h-4 w-4' />
                    <span>Saldo estimado de caja</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className={`text-sm font-semibold ${treasury.estimatedBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                      {formatCurrency(treasury.estimatedBalance)}
                    </span>
                    <span className='text-[10px] text-muted-foreground'>(ventas + abonos − pagos CxP, acumulado)</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className='lg:col-span-4'>
            <CardHeader>
              <div className='flex items-center justify-between gap-2'>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <Gauge className='h-4 w-4' />
                  Salud del Negocio
                </CardTitle>
                <span className='text-[10px] font-semibold uppercase tracking-wider text-primary/60'>{periodContext.label}</span>
              </div>
              <CardDescription>Semáforo integral de operación</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='rounded-xl border bg-muted/30 p-4 text-center'>
                <p className='text-xs text-muted-foreground'>Puntaje</p>
                <p className={`text-4xl font-bold ${businessHealthClass}`}>{businessHealthScore}</p>
                <p className={`text-sm font-medium ${businessHealthClass}`}>{businessHealthLabel}</p>
              </div>
              <div className='space-y-2 text-xs'>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground'>Cobertura costos ({periodContext.label.toLowerCase()})</span>
                  <span className='font-medium'>{formatPercentage(activeFinancials.costCoveragePercent)}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground'>Riesgo de stock (actual)</span>
                  <span className='font-medium'>{formatPercentage(zimpleIndicators.stockRiskPercent)}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground'>Exposición CxC (histórico)</span>
                  <span className='font-medium'>{formatPercentage(zimpleIndicators.creditExposurePercent)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!hasSalesHistory && (
        <Card className='border-dashed'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <AlertCircle className='h-4 w-4 text-warning' />
              Aún no hay ventas registradas
            </CardTitle>
            <CardDescription>
              Esta organización tiene productos o configuración cargada, pero todavía no registra ventas pagadas.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='grid gap-3 md:grid-cols-3'>
              <div className='rounded-lg border bg-muted/30 p-3'>
                <p className='text-xs text-muted-foreground'>Productos activos</p>
                <p className='mt-1 text-lg font-semibold'>{products.count}</p>
              </div>
              <div className='rounded-lg border bg-muted/30 p-3'>
                <p className='text-xs text-muted-foreground'>Clientes registrados</p>
                <p className='mt-1 text-lg font-semibold'>{customers.total}</p>
              </div>
              <div className='rounded-lg border bg-muted/30 p-3'>
                <p className='text-xs text-muted-foreground'>Inventario a costo</p>
                <p className='mt-1 text-lg font-semibold'>{formatCurrency(zimpleIndicators.inventoryValueAtCost)}</p>
              </div>
            </div>
            <p className='text-sm text-muted-foreground'>
              Cuando registres la primera venta, el dashboard mostrará facturación, ticket promedio, margen y comparativas automáticamente.
            </p>
            <div className='flex flex-wrap gap-3 text-sm'>
              <Link href='/dashboard/pos' className='text-primary hover:underline'>
                Ir al POS
              </Link>
              <Link href='/dashboard/documents' className='text-primary hover:underline'>
                Revisar documentos
              </Link>
              <Link href='/dashboard/products' className='text-primary hover:underline'>
                Ver productos
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {hasSalesHistory && !hasSelectedMonthlyData && (
        <Card className='border-dashed'>
          <CardContent className='flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between'>
            <div>
              <p className='text-sm font-medium'>Sin ventas para {periodLabelMap[period].toLowerCase()}</p>
              <p className='text-sm text-muted-foreground'>
                La organización sí tiene ventas históricas, pero no en el período seleccionado.
              </p>
            </div>
            <div className='text-xs text-muted-foreground'>
              Histórico acumulado: {formatCurrency(sales.allTime.total)} en {sales.allTime.count} ventas
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Cobranza (CxC) + Proveedores (CxP) — Siempre visible ── */}
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
          {/* ─── Tarjeta CxC ─────────────────────────────────────── */}
          <Card>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between gap-2'>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <CheckCircle2 className='h-4 w-4 text-emerald-500' />
                  Cobranza · CxC
                </CardTitle>
                {receivables.collectionEfficiencyPct !== null && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    receivables.collectionEfficiencyPct >= 80
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : receivables.collectionEfficiencyPct >= 50
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-destructive/10 text-destructive'
                  }`}>
                    {receivables.collectionEfficiencyPct}% cobrado del período
                  </span>
                )}
              </div>
              <CardDescription>Créditos activos de clientes · saldos en tiempo real</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-3 gap-3'>
                <div className='rounded-lg border bg-muted/30 p-3 text-center'>
                  <p className='text-[11px] text-muted-foreground'>Total activo</p>
                  <p className='mt-1 text-lg font-semibold'>{formatCurrency(receivables.totalActive)}</p>
                </div>
                <div className={`rounded-lg border p-3 text-center ${
                  receivables.overdue > 0 ? 'border-destructive/30 bg-destructive/5' : 'bg-muted/30'
                }`}>
                  <p className='text-[11px] text-muted-foreground'>Vencido</p>
                  <p className={`mt-1 text-lg font-semibold ${
                    receivables.overdue > 0 ? 'text-destructive' : ''
                  }`}>{formatCurrency(receivables.overdue)}</p>
                </div>
                <div className={`rounded-lg border p-3 text-center ${
                  receivables.dueSoon > 0 ? 'border-amber-500/30 bg-amber-500/5' : 'bg-muted/30'
                }`}>
                  <p className='text-[11px] text-muted-foreground'>Por vencer (7d)</p>
                  <p className={`mt-1 text-lg font-semibold ${
                    receivables.dueSoon > 0 ? 'text-amber-600 dark:text-amber-400' : ''
                  }`}>{formatCurrency(receivables.dueSoon)}</p>
                </div>
              </div>
              {(receivables.emittedThisPeriod > 0 || receivables.collectedThisPeriod > 0) && (
                <div className='flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-2.5 text-sm'>
                  <div className='flex flex-col gap-0.5'>
                    <p className='text-[11px] text-muted-foreground'>Emitido {periodContext.label.toLowerCase()}</p>
                    <p className='font-semibold'>{formatCurrency(receivables.emittedThisPeriod)}</p>
                  </div>
                  <div className='h-8 w-px bg-border' />
                  <div className='flex flex-col items-end gap-0.5'>
                    <p className='text-[11px] text-muted-foreground'>Cobrado {periodContext.label.toLowerCase()}</p>
                    <p className='font-semibold text-emerald-600 dark:text-emerald-400'>{formatCurrency(receivables.collectedThisPeriod)}</p>
                  </div>
                  {receivables.collectionEfficiencyPct !== null && (
                    <div className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      receivables.collectionEfficiencyPct >= 80
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : receivables.collectionEfficiencyPct >= 50
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-destructive/10 text-destructive'
                    }`}>
                      {receivables.collectionEfficiencyPct}%
                    </div>
                  )}
                </div>
              )}
              {receivables.topDebtors.length > 0 && (
                <div>
                  <p className='mb-2 text-xs font-medium text-muted-foreground'>Top deudores</p>
                  <div className='space-y-1.5'>
                    {receivables.topDebtors.map((d) => (
                      <div key={d.customerId} className='flex items-center justify-between text-sm'>
                        <span className='truncate text-muted-foreground'>{d.customerName}</span>
                        <span className='ml-2 shrink-0 font-medium'>{formatCurrency(d.balance)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ─── Tarjeta CxP ─────────────────────────────────────── */}
          <Card>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between gap-2'>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <Building2 className='h-4 w-4 text-blue-500' />
                  Proveedores · CxP
                </CardTitle>
                {payables.overdue > 0 && (
                  <span className='flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive'>
                    <BadgeAlert className='h-3 w-3' />
                    {formatCurrency(payables.overdue)} vencido
                  </span>
                )}
              </div>
              <CardDescription>Cuentas por pagar a proveedores · saldos en tiempo real</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-3 gap-3'>
                <div className='rounded-lg border bg-muted/30 p-3 text-center'>
                  <p className='text-[11px] text-muted-foreground'>Total pendiente</p>
                  <p className='mt-1 text-lg font-semibold'>{formatCurrency(payables.totalPending)}</p>
                </div>
                <div className={`rounded-lg border p-3 text-center ${
                  payables.overdue > 0 ? 'border-destructive/30 bg-destructive/5' : 'bg-muted/30'
                }`}>
                  <p className='text-[11px] text-muted-foreground'>Vencido</p>
                  <p className={`mt-1 text-lg font-semibold ${
                    payables.overdue > 0 ? 'text-destructive' : ''
                  }`}>{formatCurrency(payables.overdue)}</p>
                </div>
                <div className={`rounded-lg border p-3 text-center ${
                  payables.dueSoon > 0 ? 'border-amber-500/30 bg-amber-500/5' : 'bg-muted/30'
                }`}>
                  <p className='text-[11px] text-muted-foreground'>Por vencer (7d)</p>
                  <p className={`mt-1 text-lg font-semibold ${
                    payables.dueSoon > 0 ? 'text-amber-600 dark:text-amber-400' : ''
                  }`}>{formatCurrency(payables.dueSoon)}</p>
                </div>
              </div>
              {payables.paidThisPeriod > 0 && (
                <div className='flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5'>
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <CheckCircle2 className='h-3.5 w-3.5 text-emerald-500' />
                    <span>Pagado {periodContext.label.toLowerCase()}</span>
                  </div>
                  <span className='text-sm font-semibold text-emerald-600 dark:text-emerald-400'>
                    {formatCurrency(payables.paidThisPeriod)}
                  </span>
                </div>
              )}
              {payables.topSuppliers.length > 0 && (
                <div>
                  <p className='mb-2 text-xs font-medium text-muted-foreground'>Top proveedores</p>
                  <div className='space-y-1.5'>
                    {payables.topSuppliers.map((s) => (
                      <div key={s.supplierId} className='flex items-center justify-between text-sm'>
                        <span className='truncate text-muted-foreground'>{s.supplierName}</span>
                        <span className='ml-2 shrink-0 font-medium'>{formatCurrency(s.balance)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
      </div>

      <DashboardZimpleCharts
        salesTrend={salesTrend}
        paymentMix={paymentMix}
        topProducts={topProducts}
        realResultTrend={realResultTrend}
        productsWithoutSales30dCount={zimpleIndicators.productsWithoutSales30dCount}
        lowStockCount={products.lowStockCount}
        periodLabel={periodContext.label}
        compareLabel={periodContext.compareLabel}
      />

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-12'>
        <Card className='lg:col-span-7'>
          <CardHeader>
            <CardTitle>Panel Zimple (Prioridades)</CardTitle>
            <CardDescription>Qué debes mover esta semana para mejorar resultados</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              <div className='rounded-lg border p-3'>
                <p className='text-xs text-muted-foreground flex items-center gap-1'>
                  <Wallet className='h-3.5 w-3.5' />
                  Caja en riesgo (vencidos)
                </p>
                <p className='mt-1 text-base font-semibold text-warning'>
                  {formatCurrency(zimpleIndicators.overdueCreditsBalance)}
                </p>
                <p className='text-[11px] text-muted-foreground'>
                  {zimpleIndicators.overdueCreditsCount} créditos vencidos
                </p>
              </div>
              <div className='rounded-lg border p-3'>
                <p className='text-xs text-muted-foreground flex items-center gap-1'>
                  <Boxes className='h-3.5 w-3.5' />
                  Riesgo de inventario
                </p>
                <p className='mt-1 text-base font-semibold'>
                  {formatPercentage(zimpleIndicators.stockRiskPercent)}
                </p>
                <p className='text-[11px] text-muted-foreground'>
                  {products.lowStockCount} con stock bajo
                </p>
              </div>
            </div>

            <div className='space-y-2'>
              {zimpleIndicators.actionItems.length > 0 ? (
                zimpleIndicators.actionItems.slice(0, 4).map((item, index) => (
                  <div key={`${item}-${index}`} className='flex gap-3 rounded-lg border p-3'>
                    <span className='mt-0.5 text-xs font-semibold text-primary'>#{index + 1}</span>
                    <p className='text-sm text-muted-foreground'>{item}</p>
                  </div>
                ))
              ) : (
                <div className='rounded-lg border p-3'>
                  <p className='text-sm text-muted-foreground'>
                    Tu operación está estable. Mantén control semanal de costos, stock y cobranza.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className='lg:col-span-5'>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas ventas registradas</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSales.length === 0 ? (
              <div className='text-center py-8 text-muted-foreground'>
                <p>No hay ventas registradas aún</p>
                <p className='text-sm mt-2'>
                  <Link href='/dashboard/pos' className='text-primary hover:underline'>
                    Realizar primera venta
                  </Link>
                </p>
              </div>
            ) : (
              <div className='space-y-3'>
                {recentSales.slice(0, 6).map((sale) => {
                  const saleDate = sale.createdAt ? new Date(sale.createdAt) : null;
                  const isValidDate = saleDate && !isNaN(saleDate.getTime());

                  return (
                    <div key={sale.id} className='flex items-center justify-between rounded-lg border p-3'>
                      <div className='flex items-center gap-3 min-w-0'>
                        <FileText className='h-4 w-4 text-muted-foreground shrink-0' />
                        <div className='min-w-0'>
                          <p className='text-sm font-medium truncate'>Ticket #{sale.documentNumber || sale.id.slice(0, 8)}</p>
                          <p className='text-xs text-muted-foreground truncate'>{sale.customerName || 'Cliente sin nombre'}</p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <p className='text-sm font-semibold text-success'>{formatCurrency(sale.total)}</p>
                        <p className='text-xs text-muted-foreground'>
                          {isValidDate
                            ? formatDistanceToNow(saleDate, { addSuffix: true, locale: es })
                            : 'Fecha no disponible'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {(documents.pendingQuotes > 0 || documents.pendingInvoices > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <ShieldAlert className='h-4 w-4 text-warning' />
              Documentos Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-sm space-y-1'>
              {documents.pendingQuotes > 0 && (
                <p>{documents.pendingQuotes} {documents.pendingQuotes === 1 ? 'cotización pendiente' : 'cotizaciones pendientes'}</p>
              )}
              {documents.pendingInvoices > 0 && (
                <p>{documents.pendingInvoices} {documents.pendingInvoices === 1 ? 'factura pendiente' : 'facturas pendientes'}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {hasProjectsModule && projectKpis ? (
        <>
          <div className='grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Proyectos Activos</CardTitle>
                <TrendingUp className='h-5 w-5 text-primary' strokeWidth={1.75} />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{projectKpis.activeProjects}</div>
                <p className='text-xs text-muted-foreground'>
                  {projectKpis.totalProjects} proyectos históricos
                </p>
                {projectKpis.overBudgetProjects > 0 ? (
                  <p className='text-xs text-destructive mt-1'>
                    {projectKpis.overBudgetProjects} sobre presupuesto
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Avance de Hitos</CardTitle>
                <FileText className='h-5 w-5 text-muted-foreground' strokeWidth={1.75} />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{formatPercentage(projectKpis.milestoneProgressPercent)}</div>
                <p className='text-xs text-muted-foreground'>
                  {projectKpis.milestonesCompleted} de {projectKpis.milestonesTotal} completados
                </p>
                {projectKpis.milestonesOverdue > 0 ? (
                  <p className='text-xs text-warning mt-1'>
                    {projectKpis.milestonesOverdue} hitos vencidos
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Presupuesto vs Costo</CardTitle>
                <DollarSign className='h-5 w-5 text-success' strokeWidth={1.75} />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{formatPercentage(projectKpis.budgetUsagePercent)}</div>
                <p className='text-xs text-muted-foreground'>
                  {formatCurrency(projectKpis.actualCostTotal)} / {formatCurrency(projectKpis.budgetTotal)}
                </p>
                <p className={`text-xs mt-1 ${projectKpis.budgetVariance > 0 ? 'text-destructive' : 'text-success'}`}>
                  {projectKpis.budgetVariance > 0 ? '+' : ''}
                  {formatCurrency(projectKpis.budgetVariance)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Conversión Cotizaciones</CardTitle>
                <Users className='h-5 w-5 text-muted-foreground' strokeWidth={1.75} />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {formatPercentage(projectKpis.quoteToProjectConversionPercent)}
                </div>
                <p className='text-xs text-muted-foreground'>
                  {projectKpis.convertedProjects} de {projectKpis.approvedQuotes} aprobadas
                </p>
              </CardContent>
            </Card>
          </div>

          <div className='grid gap-6 grid-cols-1 lg:grid-cols-7'>
            <Card className='lg:col-span-4'>
              <CardHeader>
                <CardTitle>Distribución de Proyectos</CardTitle>
                <CardDescription>Estado actual del track servicios</CardDescription>
              </CardHeader>
              <CardContent>
                <ProjectsStatusChart data={projectKpis.statusDistribution} />
              </CardContent>
            </Card>

            <Card className='lg:col-span-3'>
              <CardHeader>
                <CardTitle>Resumen de Estados</CardTitle>
                <CardDescription>Detalle histórico por etapa</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-muted-foreground'>Activos</span>
                    <span className='font-medium'>{projectKpis.activeProjects}</span>
                  </div>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-muted-foreground'>En pausa</span>
                    <span className='font-medium'>{projectKpis.onHoldProjects}</span>
                  </div>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-muted-foreground'>Completados</span>
                    <span className='font-medium'>{projectKpis.completedProjects}</span>
                  </div>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-muted-foreground'>Cancelados</span>
                    <span className='font-medium'>{projectKpis.cancelledProjects}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      {/* Alerta de Stock Bajo */}
      {products.lowStockCount > 0 && products.lowStockProducts && products.lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertCircle className="h-5 w-5" />
              Productos con Stock Bajo
            </CardTitle>
            <CardDescription>
              Los siguientes productos necesitan reposición
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {products.lowStockProducts.map((product: any) => (
                <div key={product.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-warning">
                      Stock: {product.currentStock}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Mínimo: {product.minStock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link 
                href="/dashboard/products" 
                className="text-sm text-primary hover:underline"
              >
                Ver todos los productos →
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
