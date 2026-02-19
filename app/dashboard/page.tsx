import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  TrendingUp, 
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
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/utils/dashboard-helpers';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { ProjectsStatusChart } from '@/app/dashboard/_components/projects-status-chart';
import { DashboardZimpleCharts } from '@/app/dashboard/_components/dashboard-zimple-charts';
import { SetupChecklist } from '@/app/dashboard/_components/setup-checklist';

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

async function getDashboardKPIs() {
  try {
    const headersList = await headers();
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/dashboard/kpis`, {
      next: { revalidate: 60 }, // Caché de 1 minuto
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

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (!session.user.organizationId) {
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

  const kpisData = await getDashboardKPIs();
  
  if (!kpisData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
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

  const marginComponent = Math.max(0, Math.min(100, financials.thisMonth.realMarginPercent * 2));
  const coverageComponent = Math.max(0, Math.min(100, financials.thisMonth.costCoveragePercent));
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

  return (
    <div className='space-y-4 md:space-y-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>Dashboard Comercial</h1>
        <p className='text-sm text-muted-foreground md:text-base'>
          Entiende tu negocio en segundos: caja, rentabilidad, cobranza e inventario.
        </p>
      </div>

      {/* Checklist de activación para organizaciones nuevas */}
      <SetupChecklist />

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-12'>
        <Card className='lg:col-span-8'>
          <CardHeader className='space-y-3'>
            <div className='flex items-center justify-between gap-2'>
              <div>
                <CardTitle className='text-base md:text-lg'>Pulso de Ventas</CardTitle>
                <CardDescription>Vista rápida de hoy y del mes</CardDescription>
              </div>
              <div className='rounded-md border px-2 py-1 text-xs text-muted-foreground'>
                Actualizado en tiempo real
              </div>
            </div>
            <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
              <div className='rounded-lg border bg-muted/40 p-3'>
                <p className='text-xs text-muted-foreground'>Ventas Hoy</p>
                <p className='mt-1 text-base font-semibold md:text-lg'>{formatCurrency(sales.today.total)}</p>
                <p className='text-[11px] text-muted-foreground'>
                  {sales.today.count} {sales.today.count === 1 ? 'venta' : 'ventas'}
                </p>
              </div>
              <div className='rounded-lg border bg-muted/40 p-3'>
                <p className='text-xs text-muted-foreground'>Ventas Mes</p>
                <p className='mt-1 text-base font-semibold md:text-lg'>{formatCurrency(sales.thisMonth.total)}</p>
                <p className='text-[11px] text-muted-foreground'>
                  Neto {formatCurrency(sales.thisMonth.net)}
                </p>
              </div>
              <div className='rounded-lg border bg-muted/40 p-3'>
                <p className='text-xs text-muted-foreground'>Margen Real</p>
                <p className='mt-1 text-base font-semibold md:text-lg'>
                  {formatPercentage(financials.thisMonth.realMarginPercent)}
                </p>
                <p className='text-[11px] text-muted-foreground'>
                  {formatCurrency(financials.thisMonth.realProfit)} utilidad real
                </p>
              </div>
              <div className='rounded-lg border bg-muted/40 p-3'>
                <p className='text-xs text-muted-foreground'>Ticket Promedio</p>
                <p className='mt-1 text-base font-semibold md:text-lg'>
                  {formatCurrency(zimpleIndicators.avgTicketThisMonth)}
                </p>
                <p className='text-[11px] text-muted-foreground'>
                  {sales.thisMonth.count} ventas pagadas
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className='pt-0'>
            <div className='flex flex-wrap items-center gap-2 text-xs'>
              <span className='rounded-full border px-2 py-1'>IVA del mes: {formatCurrency(financials.thisMonth.taxAmount)}</span>
              <span className='rounded-full border px-2 py-1'>Descuento global: {formatCurrency(financials.thisMonth.globalDiscount)}</span>
              <span className='rounded-full border px-2 py-1'>Egresos Mi Caja: {formatCurrency(financials.thisMonth.operationalExpenses)}</span>
              <span className='rounded-full border px-2 py-1'>Comisión tarjetas: {formatCurrency(financials.thisMonth.cardCommissions)}</span>
              <span className='rounded-full border px-2 py-1'>Cobranza del mes: {formatCurrency(zimpleIndicators.collectionsThisMonth)}</span>
              <span className='rounded-full border px-2 py-1'>CxC total: {formatCurrency(accountsReceivable.total)}</span>
              <span className='rounded-full border px-2 py-1'>Inventario a costo: {formatCurrency(zimpleIndicators.inventoryValueAtCost)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className='lg:col-span-4'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Gauge className='h-4 w-4' />
              Salud del Negocio
            </CardTitle>
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
                <span className='text-muted-foreground'>Cobertura costos</span>
                <span className='font-medium'>{formatPercentage(financials.thisMonth.costCoveragePercent)}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground'>Riesgo de stock</span>
                <span className='font-medium'>{formatPercentage(zimpleIndicators.stockRiskPercent)}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground'>Exposición CxC</span>
                <span className='font-medium'>{formatPercentage(zimpleIndicators.creditExposurePercent)}</span>
              </div>
            </div>
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
