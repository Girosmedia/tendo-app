'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ZReportDocument } from '@/lib/utils/generate-z-report';

interface ReportData {
  cashRegister: {
    id: string;
    status: 'OPEN' | 'CLOSED';
    openedAt: string;
    closedAt: string;
    openingCash: number;
    expectedCash: number;
    actualCash: number | null;
    difference: number | null;
    totalSales: number;
    salesCount: number;
    notes: string | null;
  };
  sales: Array<{
    id: string;
    documentNumber: string;
    customerName: string;
    customerRut: string;
    paymentMethod: string;
    subtotal: number;
    taxAmount: number;
    discount: number;
    total: number;
    issuedAt: string;
    items: Array<{
      name: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
  }>;
  paymentSummary: Record<string, { count: number; total: number }>;
  taxSummary: {
    subtotal: number;
    taxAmount: number;
    discount: number;
    total: number;
  };
  topProducts: Array<{
    productId: string | null;
    productName: string;
    sku: string;
    quantity: number;
    revenue: number;
  }>;
  organization: {
    name: string;
    rut: string | null;
  };
}

interface ReportViewerProps {
  cashRegisterId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportViewer({ cashRegisterId, open, onOpenChange }: ReportViewerProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Detectar que estamos en el cliente (necesario para PDFDownloadLink)
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (open && cashRegisterId) {
      loadReportData();
    }
  }, [open, cashRegisterId]);

  async function loadReportData() {
    if (!cashRegisterId) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/cash-register/${cashRegisterId}/report`);
      if (!res.ok) throw new Error('Error al cargar reporte');

      const data = await res.json();
      setReportData(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar datos del reporte');
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const downloadSalesCsv = () => {
    if (!reportData) return;

    const headers = [
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

    const rows = reportData.sales.map((sale) => [
      String(sale.documentNumber),
      formatDate(sale.issuedAt),
      sale.customerName,
      sale.customerRut,
      sale.paymentMethod,
      String(Math.round(sale.subtotal)),
      String(Math.round(sale.taxAmount)),
      String(Math.round(sale.discount)),
      String(Math.round(sale.total)),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-ventas-caja-${reportData.cashRegister.id}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isClosedCashRegister = reportData?.cashRegister.status === 'CLOSED';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isClosedCashRegister ? 'Reporte Z - Cierre de Caja' : 'Detalle de Ventas - Caja Activa'}
          </DialogTitle>
          <DialogDescription>
            {isClosedCashRegister
              ? 'Resumen completo del turno de caja'
              : 'Resumen parcial del turno en curso'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : reportData ? (
          <div className="space-y-6">
            {/* Información del Turno */}
            <div className="border rounded-lg p-4 bg-muted/50">
              <h3 className="font-semibold mb-3">Información del Turno</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Apertura:</span>
                  <p className="font-medium">{formatDate(reportData.cashRegister.openedAt)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cierre:</span>
                  <p className="font-medium">{formatDate(reportData.cashRegister.closedAt)}</p>
                </div>
              </div>
            </div>

            {/* Resumen de Efectivo */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                💵 Arqueo de Efectivo
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fondo Inicial:</span>
                  <span className="font-medium">{formatCurrency(reportData.cashRegister.openingCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Efectivo Esperado:</span>
                  <span className="font-medium">{formatCurrency(reportData.cashRegister.expectedCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Efectivo Contado:</span>
                  <span className="font-medium">
                    {isClosedCashRegister && reportData.cashRegister.actualCash !== null
                      ? formatCurrency(reportData.cashRegister.actualCash)
                      : 'Turno abierto'}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Diferencia:</span>
                  {isClosedCashRegister && reportData.cashRegister.difference !== null ? (
                    <span className={`font-bold ${reportData.cashRegister.difference >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(reportData.cashRegister.difference)}
                    </span>
                  ) : (
                    <span className="font-medium text-muted-foreground">Se calcula al cierre</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                ℹ️ El arqueo de efectivo solo considera billetes y monedas físicos. Los vouchers de tarjeta y comprobantes de transferencia se verifican contra los registros bancarios.
              </p>
            </div>

            {/* Resumen de Ventas */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Resumen de Ventas</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de Ventas:</span>
                  <span className="font-medium">{reportData.cashRegister.salesCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto Total:</span>
                  <span className="font-bold text-lg">{formatCurrency(reportData.cashRegister.totalSales)}</span>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Resumen Tributario</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Neto:</span>
                  <span className="font-medium">{formatCurrency(reportData.taxSummary.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA:</span>
                  <span className="font-medium">{formatCurrency(reportData.taxSummary.taxAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Descuento Global:</span>
                  <span className="font-medium">-{formatCurrency(reportData.taxSummary.discount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Total Final:</span>
                  <span className="font-bold">{formatCurrency(reportData.taxSummary.total)}</span>
                </div>
              </div>
            </div>

            {/* Detalle por Método de Pago */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Detalle por Método de Pago</h3>
              <div className="space-y-2">
                {Object.entries(reportData.paymentSummary).map(([method, data]) => (
                  <div key={method} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {method === 'CASH' ? 'Efectivo' : method === 'CARD' ? 'Tarjeta' : method === 'TRANSFER' ? 'Transferencia' : method}:
                    </span>
                    <span className="font-medium">
                      {data.count} ventas - {formatCurrency(data.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Productos Más Vendidos */}
            {reportData.topProducts.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Top 5 Productos</h3>
                <div className="space-y-2">
                  {reportData.topProducts.map((product, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate flex-1">
                        {index + 1}. {product.productName}
                      </span>
                      <span className="font-medium ml-2">
                        {product.quantity} un. - {formatCurrency(product.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reportData.sales.length > 0 && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="font-semibold">Detalle de Ventas del Turno</h3>
                  <Button variant="outline" size="sm" onClick={downloadSalesCsv}>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar CSV
                  </Button>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-2">
                    {reportData.sales.map((sale) => (
                      <div key={sale.id} className="rounded border p-3 text-xs md:text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="font-medium">Venta #{sale.documentNumber}</span>
                          <span className="text-muted-foreground">{formatDate(sale.issuedAt)}</span>
                        </div>
                        <div className="mt-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                          <span className="text-muted-foreground">Neto: {formatCurrency(sale.subtotal)}</span>
                          <span className="text-muted-foreground">IVA: {formatCurrency(sale.taxAmount)}</span>
                          <span className="text-muted-foreground">Desc: -{formatCurrency(sale.discount)}</span>
                          <span className="font-semibold">Total: {formatCurrency(sale.total)}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Notas */}
            {reportData.cashRegister.notes && (
              <div className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-950">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Observaciones
                </h3>
                <p className="text-sm">{reportData.cashRegister.notes}</p>
              </div>
            )}

            {/* Botón de Descarga */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
              {isClient && isClosedCashRegister && (
                <PDFDownloadLink
                  document={
                    <ZReportDocument
                      data={{
                        ...reportData,
                        cashRegister: {
                          ...reportData.cashRegister,
                          actualCash: reportData.cashRegister.actualCash ?? 0,
                          difference: reportData.cashRegister.difference ?? 0,
                        },
                      }}
                    />
                  }
                  fileName={`reporte-z-${reportData.cashRegister.id}.pdf`}
                >
                  {({ loading }) => (
                    <Button disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Descargar PDF
                        </>
                      )}
                    </Button>
                  )}
                </PDFDownloadLink>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
