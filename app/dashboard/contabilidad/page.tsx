import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Download, Landmark, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/utils/dashboard-helpers';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AccountingMonthlySummary {
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

interface AccountingBalanceSnapshot {
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

interface AccountingSeriesPoint {
  month: string;
  monthLabel: string;
  netCashFlow: number;
  operatingResult: number;
  cashInflowsTotal: number;
  cashOutflowsTotal: number;
}

interface MoneyWithTooltipProps {
  amount: number;
  tooltip: string;
  className?: string;
}

function MoneyWithTooltip({ amount, tooltip, className }: MoneyWithTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`cursor-help underline decoration-dotted underline-offset-2 ${className || ''}`}>
          {formatCurrency(amount)}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

async function getAccountingData() {
  try {
    const headersList = await headers();
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const authHeaders = {
      Cookie: headersList.get('cookie') || '',
    };

    const [monthlyRes, balanceRes, seriesRes] = await Promise.all([
      fetch(`${baseUrl}/api/accounting/monthly`, { next: { revalidate: 60 }, headers: authHeaders }),
      fetch(`${baseUrl}/api/accounting/balance`, { next: { revalidate: 60 }, headers: authHeaders }),
      fetch(`${baseUrl}/api/accounting/series?months=6`, { next: { revalidate: 60 }, headers: authHeaders }),
    ]);

    if (!monthlyRes.ok || !balanceRes.ok || !seriesRes.ok) {
      return null;
    }

    const [monthlyData, balanceData, seriesData] = await Promise.all([
      monthlyRes.json(),
      balanceRes.json(),
      seriesRes.json(),
    ]);

    return {
      monthly: monthlyData.summary as AccountingMonthlySummary,
      balance: balanceData.balance as AccountingBalanceSnapshot,
      series: (seriesData.series || []) as AccountingSeriesPoint[],
    };
  } catch (error) {
    console.error('Error cargando módulo contabilidad:', error);
    return null;
  }
}

export default async function ContabilidadPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (!session.user.organizationId) {
    redirect('/onboarding');
  }

  const data = await getAccountingData();

  if (!data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error al cargar contabilidad
            </CardTitle>
            <CardDescription>
              No se pudo cargar el módulo de Contabilidad Zimple. Intenta nuevamente.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { monthly, balance, series } = data;
  const isPositiveCashFlow = monthly.netCashFlow >= 0;
  const isPositiveResult = monthly.operatingResult >= 0;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Contabilidad Zimple</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Flujo de caja mensual y balance operativo simplificado para {monthly.monthLabel}.
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="w-full md:w-auto">
          <Link href={`/api/accounting/export-csv?month=${monthly.month}&months=6`}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Flujo Neto del Mes</CardDescription>
            <CardTitle className={isPositiveCashFlow ? 'text-success' : 'text-destructive'}>
              <MoneyWithTooltip
                amount={monthly.netCashFlow}
                tooltip="Flujo neto = ingresos de caja - egresos de caja. Muestra si en el mes te sobró o faltó caja."
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Ingresos caja{' '}
            <MoneyWithTooltip
              amount={monthly.cashInflowsTotal}
              tooltip="Ingresos caja = contado + cobranzas + cobros de proyectos + ingresos de tesorería. Es todo lo que entró realmente a caja."
            />{' '}
            · Egresos caja{' '}
            <MoneyWithTooltip
              amount={monthly.cashOutflowsTotal}
              className="text-destructive"
              tooltip="Egresos caja = gastos operacionales + egresos de proyectos + egresos de tesorería. Es todo lo que salió realmente de caja."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resultado Operativo</CardDescription>
            <CardTitle className={isPositiveResult ? 'text-success' : 'text-destructive'}>
              <MoneyWithTooltip
                amount={monthly.operatingResult}
                tooltip="Resultado operativo = utilidad bruta + cobros de proyectos - egresos operacionales - egresos de proyectos. Mide el desempeño del negocio en su operación."
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Margen operativo {formatPercentage(monthly.operatingMarginPercent)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cuentas por Cobrar</CardDescription>
            <CardTitle>
              <MoneyWithTooltip
                amount={balance.assets.accountsReceivable}
                tooltip="CxC total = CxC clientes + CxC proyectos. Es todo lo que aún te deben."
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {balance.context.customersWithDebt} clientes + {balance.context.projectsWithPendingCollection} proyectos pendientes
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cuentas por Pagar</CardDescription>
            <CardTitle className="text-destructive">
              <MoneyWithTooltip
                amount={balance.liabilities.accountsPayable}
                className="text-destructive"
                tooltip="CxP = suma de cuentas por pagar pendientes. Es lo que debes a proveedores."
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {balance.context.payablesPendingCount} cuentas pendientes
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4" />
              Flujo de Caja del Mes
            </CardTitle>
            <CardDescription>Base caja: evita doble conteo entre fiados emitidos y cobranzas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-muted-foreground">Ventas cobradas en el acto</span>
              <span className="font-medium">
                <MoneyWithTooltip
                  amount={monthly.immediateCashSalesTotal}
                  tooltip="Contado = ventas pagadas al momento. Dinero que entra de inmediato a caja."
                />
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-muted-foreground">Cobranzas de crédito</span>
              <span className="font-medium">
                <MoneyWithTooltip
                  amount={monthly.collectionsTotal}
                  tooltip="Cobranzas = pagos recibidos de fiados. Solo considera lo efectivamente cobrado en el mes."
                />
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-muted-foreground">Cobros de proyectos</span>
              <span className="font-medium">
                <MoneyWithTooltip
                  amount={monthly.projectCollectionsTotal}
                  tooltip="Cobros proyectos = pagos efectivamente recibidos por proyectos en el período."
                />
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-muted-foreground">Ingresos de tesorería</span>
              <span className="font-medium">
                <MoneyWithTooltip
                  amount={monthly.treasuryInflowsTotal}
                  tooltip="Ingresos tesorería = entradas no comerciales (aporte, préstamo, otros)."
                />
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-muted-foreground">Egresos operacionales</span>
              <span className="font-medium text-destructive">
                <MoneyWithTooltip
                  amount={monthly.operationalExpensesTotal}
                  className="text-destructive"
                  tooltip="Egresos operacionales = gastos del funcionamiento diario del negocio."
                />
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-muted-foreground">Egresos de proyectos</span>
              <span className="font-medium text-destructive">
                <MoneyWithTooltip
                  amount={monthly.projectOutflowsTotal}
                  className="text-destructive"
                  tooltip="Egresos proyectos = gastos directos + costo de recursos del proyecto."
                />
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-muted-foreground">Egresos de tesorería</span>
              <span className="font-medium text-destructive">
                <MoneyWithTooltip
                  amount={monthly.treasuryOutflowsTotal}
                  className="text-destructive"
                  tooltip="Egresos tesorería = salidas no comerciales (CxP, retiros, préstamos, otros)."
                />
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
              <span className="font-medium">Flujo neto del mes</span>
              <span className={`font-semibold ${isPositiveCashFlow ? 'text-success' : 'text-destructive'}`}>
                <MoneyWithTooltip
                  amount={monthly.netCashFlow}
                  className={isPositiveCashFlow ? 'text-success' : 'text-destructive'}
                  tooltip="Flujo neto = ingresos de caja - egresos de caja. Resumen final del movimiento de caja del mes."
                />
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="h-4 w-4" />
              Balance Zimple
            </CardTitle>
            <CardDescription>Foto operativa del período</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-muted-foreground">CxC clientes</span>
              <span className="font-medium">
                <MoneyWithTooltip
                  amount={balance.assets.customerAccountsReceivable}
                  tooltip="CxC clientes = deuda vigente de clientes por ventas a crédito."
                />
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-muted-foreground">CxC proyectos</span>
              <span className="font-medium">
                <MoneyWithTooltip
                  amount={balance.assets.projectAccountsReceivable}
                  tooltip="CxC proyectos = monto contratado - cobros acumulados."
                />
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-muted-foreground">CxC total</span>
              <span className="font-medium">
                <MoneyWithTooltip
                  amount={balance.assets.accountsReceivable}
                  tooltip="CxC total = CxC clientes + CxC proyectos."
                />
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-muted-foreground">Activos totales</span>
              <span className="font-medium">
                <MoneyWithTooltip
                  amount={balance.assets.total}
                  tooltip="Activos totales = flujo del mes + CxC total + inventario al costo. Muestra lo que tienes en valor."
                />
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-muted-foreground">Pasivos totales</span>
              <span className="font-medium text-destructive">
                <MoneyWithTooltip
                  amount={balance.liabilities.total}
                  className="text-destructive"
                  tooltip="Pasivos totales = cuentas por pagar pendientes. Muestra lo que debes."
                />
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
              <span className="font-medium">Posición neta</span>
              <span className={`font-semibold ${balance.equity.netPosition >= 0 ? 'text-success' : 'text-destructive'}`}>
                <MoneyWithTooltip
                  amount={balance.equity.netPosition}
                  className={balance.equity.netPosition >= 0 ? 'text-success' : 'text-destructive'}
                  tooltip="Posición neta = activos totales - pasivos totales. Indica la posición general del negocio en el corte."
                />
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tendencia últimos {series.length} meses</CardTitle>
          <CardDescription>Resumen rápido de flujo neto y resultado operativo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {series.map((point) => (
            <div key={point.month} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span className="text-muted-foreground capitalize">{point.monthLabel}</span>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                  {formatCurrency(point.cashInflowsTotal)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                  {formatCurrency(point.cashOutflowsTotal)}
                </span>
                <span className={point.netCashFlow >= 0 ? 'text-success font-medium' : 'text-destructive font-medium'}>
                  {formatCurrency(point.netCashFlow)}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {(monthly.warnings.length > 0 || balance.warnings.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas de interpretación</CardTitle>
            <CardDescription>Transparencia del modelo contable simplificado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {[...monthly.warnings, ...balance.warnings].map((warning) => (
              <p key={warning}>• {warning}</p>
            ))}
          </CardContent>
        </Card>
      )}
      </div>
    </TooltipProvider>
  );
}
