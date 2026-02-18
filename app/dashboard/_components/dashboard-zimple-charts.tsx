'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/dashboard-helpers';

interface SalesTrendItem {
  dateLabel: string;
  total: number;
}

interface PaymentMixItem {
  method: string;
  label: string;
  total: number;
}

interface TopProductItem {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
}

interface RealResultTrendItem {
  dateLabel: string;
  netSales: number;
  costOfSales: number;
  operationalExpenses: number;
  cardCommissions: number;
  totalCost: number;
  realProfit: number;
  realMarginPercent: number;
}

interface DashboardZimpleChartsProps {
  salesTrend: SalesTrendItem[];
  paymentMix: PaymentMixItem[];
  topProducts: TopProductItem[];
  realResultTrend: RealResultTrendItem[];
  productsWithoutSales30dCount: number;
  lowStockCount: number;
}

const salesConfig = {
  total: {
    label: 'Ventas',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

const paymentConfig = {
  cash: {
    label: 'Efectivo',
    color: 'var(--chart-1)',
  },
  card: {
    label: 'Tarjeta',
    color: 'var(--chart-2)',
  },
  transfer: {
    label: 'Transferencia',
    color: 'var(--chart-3)',
  },
  credit: {
    label: 'Crédito',
    color: 'var(--chart-4)',
  },
  other: {
    label: 'Otros',
    color: 'var(--chart-5)',
  },
} satisfies ChartConfig;

const topProductsConfig = {
  quantity: {
    label: 'Unidades',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

const realResultConfig = {
  netSales: {
    label: 'Ventas Netas',
    color: 'var(--chart-1)',
  },
  totalCost: {
    label: 'Costo Total',
    color: 'var(--chart-3)',
  },
  realProfit: {
    label: 'Utilidad Real',
    color: 'var(--chart-2)',
  },
  realMarginPercent: {
    label: 'Margen Real %',
    color: 'var(--chart-5)',
  },
} satisfies ChartConfig;

function paymentColorKey(method: string) {
  if (method === 'CASH') return 'var(--color-cash)';
  if (method === 'CARD') return 'var(--color-card)';
  if (method === 'TRANSFER') return 'var(--color-transfer)';
  if (method === 'CREDIT') return 'var(--color-credit)';
  return 'var(--color-other)';
}

export function DashboardZimpleCharts({
  salesTrend,
  paymentMix,
  topProducts,
  realResultTrend,
  productsWithoutSales30dCount,
  lowStockCount,
}: DashboardZimpleChartsProps) {
  const totalPaymentMix = paymentMix.reduce((sum, item) => sum + item.total, 0);
  const topProductsRevenue = topProducts.reduce((sum, product) => sum + product.revenue, 0);
  const topProductsUnits = topProducts.reduce((sum, product) => sum + product.quantity, 0);
  const topProductSharePercent =
    topProductsRevenue > 0 && topProducts.length > 0
      ? (topProducts[0].revenue / topProductsRevenue) * 100
      : 0;

  return (
    <div className='grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-12'>
      <Card className='lg:col-span-7'>
        <CardHeader>
          <CardTitle>Tendencia de Ventas (7 días)</CardTitle>
          <CardDescription>Cómo se está moviendo tu caja día a día</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={salesConfig} className='h-[240px] w-full'>
            <AreaChart data={salesTrend} accessibilityLayer>
              <defs>
                <linearGradient id='salesFill' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='var(--color-total)' stopOpacity={0.35} />
                  <stop offset='95%' stopColor='var(--color-total)' stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey='dateLabel' tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Area
                type='monotone'
                dataKey='total'
                stroke='var(--color-total)'
                fill='url(#salesFill)'
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className='lg:col-span-5'>
        <CardHeader>
          <CardTitle>Mix de Pagos (30 días)</CardTitle>
          <CardDescription>Dónde está entrando tu dinero</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <ChartContainer config={paymentConfig} className='h-[220px] w-full'>
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Pie
                data={paymentMix}
                dataKey='total'
                nameKey='label'
                innerRadius={54}
                outerRadius={88}
                stroke='none'
                paddingAngle={3}
              >
                {paymentMix.map((entry) => (
                  <Cell key={entry.method} fill={paymentColorKey(entry.method)} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          <div className='space-y-2'>
            {paymentMix.map((item) => {
              const percent = totalPaymentMix > 0 ? (item.total / totalPaymentMix) * 100 : 0;
              return (
                <div key={item.method} className='flex items-center justify-between text-xs'>
                  <span className='text-muted-foreground'>{item.label}</span>
                  <span className='font-medium'>
                    {formatCurrency(item.total)} · {percent.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className='lg:col-span-8'>
        <CardHeader>
          <CardTitle>Top Productos (30 días)</CardTitle>
          <CardDescription>Qué productos están empujando tus ventas</CardDescription>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <p className='text-sm text-muted-foreground'>Aún no hay datos para este gráfico.</p>
          ) : (
            <ChartContainer config={topProductsConfig} className='h-[280px] w-full'>
              <BarChart data={topProducts} layout='vertical' margin={{ left: 10, right: 10 }} accessibilityLayer>
                <CartesianGrid horizontal={false} />
                <YAxis
                  type='category'
                  dataKey='productName'
                  tickLine={false}
                  axisLine={false}
                  width={130}
                />
                <XAxis type='number' hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey='quantity' fill='var(--color-quantity)' radius={8} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card className='lg:col-span-4'>
        <CardHeader>
          <CardTitle>Insights de Catálogo</CardTitle>
          <CardDescription>Lectura rápida para decidir compras y exhibición</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='rounded-lg border bg-muted/30 p-3'>
            <p className='text-xs text-muted-foreground'>Concentración producto líder</p>
            <p className='mt-1 text-2xl font-semibold'>{topProductSharePercent.toFixed(1)}%</p>
            <p className='text-xs text-muted-foreground'>de la facturación del top 5</p>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div className='rounded-lg border p-3'>
              <p className='text-xs text-muted-foreground'>Facturación top 5</p>
              <p className='mt-1 text-sm font-semibold'>{formatCurrency(topProductsRevenue)}</p>
            </div>
            <div className='rounded-lg border p-3'>
              <p className='text-xs text-muted-foreground'>Unidades top 5</p>
              <p className='mt-1 text-sm font-semibold'>{topProductsUnits.toLocaleString('es-CL')}</p>
            </div>
          </div>

          <div className='space-y-2 text-xs'>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground'>Sin rotación 30 días</span>
              <span className='font-medium'>{productsWithoutSales30dCount}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground'>Productos bajo stock</span>
              <span className='font-medium'>{lowStockCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className='lg:col-span-12'>
        <CardHeader>
          <CardTitle>Resultado Real (7 días)</CardTitle>
          <CardDescription>Evolución de ventas netas, costo total y utilidad real con margen</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={realResultConfig} className='h-[280px] w-full'>
            <LineChart data={realResultTrend} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey='dateLabel' tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                yAxisId='currency'
                tickLine={false}
                axisLine={false}
                width={82}
                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
              />
              <YAxis
                yAxisId='percent'
                orientation='right'
                tickLine={false}
                axisLine={false}
                width={44}
                domain={[-100, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Line yAxisId='currency' type='monotone' dataKey='netSales' stroke='var(--color-netSales)' strokeWidth={2.5} dot={false} />
              <Line yAxisId='currency' type='monotone' dataKey='totalCost' stroke='var(--color-totalCost)' strokeWidth={2.5} dot={false} />
              <Line yAxisId='currency' type='monotone' dataKey='realProfit' stroke='var(--color-realProfit)' strokeWidth={3} dot={false} />
              <Line yAxisId='percent' type='monotone' dataKey='realMarginPercent' stroke='var(--color-realMarginPercent)' strokeWidth={2} strokeDasharray='5 4' dot={false} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
