'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Calculator, Download, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { OpenDialog } from './_components/open-dialog';
import { CloseDialog } from './_components/close-dialog';
import { CashRegisterTable } from './_components/cash-register-table';
import { ReportViewer } from './_components/report-viewer';

interface CashRegister {
  id: string;
  status: 'OPEN' | 'CLOSED';
  openedBy: string;
  closedBy: string | null;
  openedAt: string;
  closedAt: string | null;
  openingCash: number;
  expectedCash: number;
  actualCash: number | null;
  difference: number | null;
  totalSales: number;
  salesCount: number;
}

interface MonthlySale {
  id: string;
  documentNumber: number;
  issuedAt: string;
  paymentMethod: string;
  customerName: string;
  customerRut: string;
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
}

function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthDateRange(monthValue: string) {
  const [yearStr, monthStr] = monthValue.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);

  const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    label: startDate.toLocaleDateString('es-CL', {
      month: 'long',
      year: 'numeric',
    }),
  };
}

function toCsvValue(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function getPaymentMethodLabel(method: string) {
  const labels: Record<string, string> = {
    CASH: 'Efectivo',
    CARD: 'Tarjeta',
    TRANSFER: 'Transferencia',
    CHECK: 'Cheque',
    CREDIT: 'Crédito',
    MULTI: 'Mixto',
  };
  return labels[method] || method;
}

export default function CashRegisterPage() {
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [activeCashRegister, setActiveCashRegister] = useState<CashRegister | null>(null);
  const [monthlySales, setMonthlySales] = useState<MonthlySale[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [reportViewerOpen, setReportViewerOpen] = useState(false);
  const [selectedCashRegisterId, setSelectedCashRegisterId] = useState<string | null>(null);

  const closedRegisters = registers.filter((register) => register.status === 'CLOSED');
  const monthSummary = closedRegisters.reduce(
    (acc, register) => {
      acc.totalSales += register.totalSales;
      acc.salesCount += register.salesCount;
      acc.closuresCount += 1;
      acc.totalDifference += register.difference || 0;
      return acc;
    },
    {
      totalSales: 0,
      salesCount: 0,
      closuresCount: 0,
      totalDifference: 0,
    }
  );

  const loadCashRegisters = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setIsRefreshing(true);
    
    try {
      const { startDate, endDate } = getMonthDateRange(selectedMonth);
      const searchParams = new URLSearchParams({
        startDate,
        endDate,
        page: '1',
        limit: '100',
      });

      const [listRes, activeRes, monthlySalesRes] = await Promise.all([
        fetch(`/api/cash-register?${searchParams.toString()}`),
        fetch('/api/cash-register/active'),
        fetch(`/api/cash-register/monthly-sales?${searchParams.toString()}`),
      ]);

      if (!listRes.ok) throw new Error('Error al cargar cajas');
      if (!activeRes.ok) throw new Error('Error al cargar caja activa');
      if (!monthlySalesRes.ok) throw new Error('Error al cargar ventas del mes');

      const [listData, activeData, monthlySalesData] = await Promise.all([
        listRes.json(),
        activeRes.json(),
        monthlySalesRes.json(),
      ]);
      setRegisters(listData.cashRegisters || []);
      setActiveCashRegister(activeData.cashRegister || null);
      setMonthlySales(monthlySalesData.sales || []);
    } catch (error) {
      console.error('Error:', error);
      if (!silent) toast.error('Error al cargar historial de cajas');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedMonth]);

  // Auto-refresh cada 30 segundos si hay caja activa
  useEffect(() => {
    if (activeCashRegister) {
      const interval = setInterval(() => {
        loadCashRegisters(true); // silent refresh
      }, 30000); // 30 segundos
      
      return () => clearInterval(interval);
    }
  }, [activeCashRegister, loadCashRegisters]);

  // Cargar datos inicialmente
  useEffect(() => {
    loadCashRegisters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  function handleOpenSuccess() {
    loadCashRegisters();
  }

  function handleCloseSuccess() {
    setActiveCashRegister(null);
    loadCashRegisters();
  }

  function handleViewReport(id: string) {
    setSelectedCashRegisterId(id);
    setReportViewerOpen(true);
  }

  function handleDownloadMonthlyCsv() {
    const { label } = getMonthDateRange(selectedMonth);

    const headers = [
      'ID Caja',
      'Apertura',
      'Cierre',
      'Estado',
      'Cantidad Ventas',
      'Total Ventas',
      'Efectivo Esperado',
      'Efectivo Contado',
      'Diferencia',
    ];

    const salesHeaders = [
      'Documento',
      'Fecha',
      'Cliente',
      'RUT',
      'Método Pago',
      'Neto',
      'IVA',
      'Descuento',
      'Total',
    ];

    const rows = closedRegisters.map((register) => [
      register.id,
      new Date(register.openedAt).toLocaleString('es-CL'),
      register.closedAt ? new Date(register.closedAt).toLocaleString('es-CL') : '',
      register.status,
      register.salesCount,
      Math.round(register.totalSales),
      Math.round(register.expectedCash),
      register.actualCash ? Math.round(register.actualCash) : 0,
      register.difference ? Math.round(register.difference) : 0,
    ]);

    const summaryRows = [
      ['Periodo', label],
      ['Total cierres', monthSummary.closuresCount],
      ['Total ventas', monthSummary.salesCount],
      ['Monto total ventas', Math.round(monthSummary.totalSales)],
      ['Diferencia acumulada', Math.round(monthSummary.totalDifference)],
      ['Documentos vendidos del mes', monthlySales.length],
      ['Neto ventas del mes', Math.round(monthlySales.reduce((acc, sale) => acc + sale.subtotal, 0))],
      ['IVA ventas del mes', Math.round(monthlySales.reduce((acc, sale) => acc + sale.taxAmount, 0))],
      ['Descuento ventas del mes', Math.round(monthlySales.reduce((acc, sale) => acc + sale.discount, 0))],
      ['Total documentos del mes', Math.round(monthlySales.reduce((acc, sale) => acc + sale.total, 0))],
    ];

    const salesRows = monthlySales.map((sale) => [
      sale.documentNumber,
      new Date(sale.issuedAt).toLocaleString('es-CL'),
      sale.customerName,
      sale.customerRut,
      getPaymentMethodLabel(sale.paymentMethod),
      Math.round(sale.subtotal),
      Math.round(sale.taxAmount),
      Math.round(sale.discount),
      Math.round(sale.total),
    ]);

    const csv = [
      [toCsvValue('Consolidado Mensual de Cierre de Caja')].join(','),
      ...summaryRows.map((row) => row.map((value) => toCsvValue(value)).join(',')),
      '',
      [toCsvValue('Detalle de Cierres de Caja')].join(','),
      headers.map((value) => toCsvValue(value)).join(','),
      ...rows.map((row) => row.map((value) => toCsvValue(value)).join(',')),
      '',
      [toCsvValue('Detalle de Ventas del Mes')].join(','),
      salesHeaders.map((value) => toCsvValue(value)).join(','),
      ...salesRows.map((row) => row.map((value) => toCsvValue(value)).join(',')),
    ].join('\n');

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cierre-caja-${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="h-6 w-6 md:h-8 md:w-8" />
            Cierre de Caja
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestiona aperturas, cierres y reportes Z
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {activeCashRegister && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => loadCashRegisters()}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
          {activeCashRegister ? (
            <Button 
              onClick={() => setCloseDialogOpen(true)} 
              size="default"
              className="flex-1 md:flex-initial md:size-lg"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Cerrar Caja
            </Button>
          ) : (
            <Button 
              onClick={() => setOpenDialogOpen(true)} 
              size="default"
              className="flex-1 md:flex-initial md:size-lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Abrir Caja
            </Button>
          )}
        </div>
      </div>

      {/* Estado Actual */}
      {activeCashRegister && (
        <Card className="border-success">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <Calculator className="h-5 w-5" />
              Caja Activa
            </CardTitle>
            <CardDescription>
              Abierta el {new Date(activeCashRegister.openedAt).toLocaleString('es-CL')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Fondo Inicial</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: 'CLP',
                  }).format(activeCashRegister.openingCash)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ventas Realizadas</p>
                <p className="text-2xl font-bold">{activeCashRegister.salesCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Vendido</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: 'CLP',
                  }).format(activeCashRegister.totalSales)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Efectivo Esperado</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: 'CLP',
                  }).format(activeCashRegister.expectedCash)}
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => handleViewReport(activeCashRegister.id)}
              >
                Ver detalle de ventas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Historial de Cierres</CardTitle>
              <CardDescription>
                Cierres y consolidado según el mes seleccionado
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full sm:w-44"
              />
              <Button
                variant="outline"
                onClick={handleDownloadMonthlyCsv}
                disabled={closedRegisters.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Cierres del mes</p>
              <p className="text-xl font-bold">{monthSummary.closuresCount}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Ventas del mes</p>
              <p className="text-xl font-bold">{monthSummary.salesCount}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Total ventas del mes</p>
              <p className="text-xl font-bold">
                {new Intl.NumberFormat('es-CL', {
                  style: 'currency',
                  currency: 'CLP',
                }).format(monthSummary.totalSales)}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Diferencia acumulada</p>
              <p className="text-xl font-bold">
                {new Intl.NumberFormat('es-CL', {
                  style: 'currency',
                  currency: 'CLP',
                }).format(monthSummary.totalDifference)}
              </p>
            </div>
          </div>
          <CashRegisterTable
            registers={closedRegisters}
            onViewReport={handleViewReport}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <OpenDialog
        open={openDialogOpen}
        onOpenChange={setOpenDialogOpen}
        onSuccess={handleOpenSuccess}
      />

      <CloseDialog
        cashRegister={activeCashRegister}
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        onSuccess={handleCloseSuccess}
      />

      <ReportViewer
        cashRegisterId={selectedCashRegisterId}
        open={reportViewerOpen}
        onOpenChange={setReportViewerOpen}
      />
    </div>
  );
}
