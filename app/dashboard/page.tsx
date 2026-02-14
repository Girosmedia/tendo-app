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
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/utils/dashboard-helpers';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

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
      count: kpisData.salesThisMonth?.count || 0,
      growthVsLastMonth: kpisData.salesGrowthVsLastMonth || 0,
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

  const topProducts = kpisData.topProducts || [];
  const recentSales = kpisData.recentSales || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen de tu negocio en tiempo real
        </p>
      </div>

      {/* KPI Cards - Bento Grid Layout */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* Ventas Hoy */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ventas Hoy
            </CardTitle>
            <DollarSign className="h-5 w-5 text-success" strokeWidth={1.75} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(sales.today.total)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {sales.today.growthVsYesterday > 0 ? (
                <>
                  <ArrowUp className="h-3 w-3 text-success" />
                  <span className="text-success">
                    +{formatPercentage(sales.today.growthVsYesterday)}
                  </span>
                </>
              ) : sales.today.growthVsYesterday < 0 ? (
                <>
                  <ArrowDown className="h-3 w-3 text-destructive" />
                  <span className="text-destructive">
                    {formatPercentage(sales.today.growthVsYesterday)}
                  </span>
                </>
              ) : (
                <span>Sin cambios</span>
              )}
              {' vs ayer'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {sales.today.count} {sales.today.count === 1 ? 'venta' : 'ventas'}
            </p>
          </CardContent>
        </Card>

        {/* Ventas del Mes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ventas del Mes
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-success" strokeWidth={1.75} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(sales.thisMonth.total)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {sales.thisMonth.growthVsLastMonth > 0 ? (
                <>
                  <ArrowUp className="h-3 w-3 text-success" />
                  <span className="text-success">
                    +{formatPercentage(sales.thisMonth.growthVsLastMonth)}
                  </span>
                </>
              ) : sales.thisMonth.growthVsLastMonth < 0 ? (
                <>
                  <ArrowDown className="h-3 w-3 text-destructive" />
                  <span className="text-destructive">
                    {formatPercentage(sales.thisMonth.growthVsLastMonth)}
                  </span>
                </>
              ) : (
                <span>Sin cambios</span>
              )}
              {' vs mes anterior'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {sales.thisMonth.count} {sales.thisMonth.count === 1 ? 'venta' : 'ventas'}
            </p>
          </CardContent>
        </Card>

        {/* Clientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes
            </CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.total}
            </div>
            <p className="text-xs text-muted-foreground">
              +{customers.newThisMonth} este mes
            </p>
            {customers.withDebt > 0 && (
              <p className="text-xs text-warning mt-1">
                {customers.withDebt} con deuda
              </p>
            )}
          </CardContent>
        </Card>

        {/* Productos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Productos
            </CardTitle>
            <Package className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.count}
            </div>
            {products.lowStockCount > 0 ? (
              <p className="text-xs text-warning flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {products.lowStockCount} con stock bajo
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Stock bajo control
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerta de Documentos Pendientes */}
      {(documents.pendingQuotes > 0 || documents.pendingInvoices > 0) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              Documentos Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
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

      {/* Sección de Datos - Bento Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        {/* Actividad Reciente */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Últimas ventas realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentSales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay ventas registradas aún</p>
                <p className="text-sm mt-2">
                  <Link href="/dashboard/pos" className="text-primary hover:underline">
                    Realizar primera venta
                  </Link>
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentSales.map((sale: any) => {
                  const saleDate = sale.createdAt ? new Date(sale.createdAt) : null;
                  const isValidDate = saleDate && !isNaN(saleDate.getTime());
                  
                  return (
                    <div key={sale.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {sale.type === 'INVOICE' ? 'Factura' : 
                             sale.type === 'RECEIPT' ? 'Boleta' : 
                             sale.type === 'QUOTE' ? 'Cotización' : 
                             'Ticket'} #{sale.documentNumber || sale.id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {sale.customerName || 'Cliente sin nombre'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-success">{formatCurrency(sale.total)}</p>
                        <p className="text-xs text-muted-foreground">
                          {isValidDate 
                            ? formatDistanceToNow(saleDate, { addSuffix: true, locale: es })
                            : 'Fecha no disponible'
                          }
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Productos */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Productos Más Vendidos</CardTitle>
            <CardDescription>
              Últimos 30 días
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No hay datos de ventas aún</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product: any, index: number) => {
                  const maxQty = topProducts[0]?.quantity || 1;
                  const percentage = (product.quantity / maxQty) * 100;
                  
                  return (
                    <div key={product.productId || index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <p className="font-medium truncate flex-1">
                          {product.productName || 'Producto sin nombre'}
                        </p>
                        <p className="text-muted-foreground ml-2">
                          {product.quantity} vendidos
                        </p>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-success transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(product.revenue)} en ventas
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
