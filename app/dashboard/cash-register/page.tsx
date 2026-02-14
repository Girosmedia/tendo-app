'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Plus, RefreshCw } from 'lucide-react';
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

export default function CashRegisterPage() {
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [activeCashRegister, setActiveCashRegister] = useState<CashRegister | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [reportViewerOpen, setReportViewerOpen] = useState(false);
  const [selectedCashRegisterId, setSelectedCashRegisterId] = useState<string | null>(null);

  const loadCashRegisters = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setIsRefreshing(true);
    
    try {
      const res = await fetch('/api/cash-register');
      if (!res.ok) throw new Error('Error al cargar cajas');
      
      const data = await res.json();
      setRegisters(data.cashRegisters || []);
      
      // Buscar caja activa del usuario
      const active = data.cashRegisters?.find(
        (r: CashRegister) => r.status === 'OPEN'
      );
      setActiveCashRegister(active || null);
    } catch (error) {
      console.error('Error:', error);
      if (!silent) toast.error('Error al cargar historial de cajas');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

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
  }, []);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="h-8 w-8" />
            Cierre de Caja
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona aperturas, cierres y reportes Z
          </p>
        </div>
        
        <div className="flex items-center gap-3">
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
            <Button onClick={() => setCloseDialogOpen(true)} size="lg">
              <Calculator className="mr-2 h-4 w-4" />
              Cerrar Caja
            </Button>
          ) : (
            <Button onClick={() => setOpenDialogOpen(true)} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Abrir Caja
            </Button>
          )}
        </div>
      </div>

      {/* Estado Actual */}
      {activeCashRegister && (
        <Card className="border-green-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
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
          </CardContent>
        </Card>
      )}

      {/* Historial */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Cierres</CardTitle>
          <CardDescription>
            Últimos cierres de caja registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CashRegisterTable
            registers={registers}
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
