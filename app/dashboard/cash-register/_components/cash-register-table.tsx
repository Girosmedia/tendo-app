'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, TrendingUp, TrendingDown, Calendar, Clock } from 'lucide-react';

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
  totalCardCommissions?: number;
}

interface CashRegisterTableProps {
  registers: CashRegister[];
  onViewReport: (id: string) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function CashRegisterTable({ registers, onViewReport }: CashRegisterTableProps) {
  if (registers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No hay cierres de caja registrados aún</p>
        <p className="text-sm mt-2">Abre una nueva caja para comenzar</p>
      </div>
    );
  }

  return (
    <>
      {/* Vista Móvil - Cards */}
      <div className="md:hidden space-y-3">
        {registers.map((register) => {
          const difference = register.difference || 0;
          const hasDifference = Math.abs(difference) > 100; // Más de $100

          return (
            <Card key={register.id}>
              <CardContent className="p-4 space-y-4">
                {/* Header: Fecha de Apertura + Estado */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="text-xs">Apertura</span>
                    </div>
                    <h4 className="font-semibold text-base">
                      {format(new Date(register.openedAt), 'dd/MM/yyyy', { locale: es })}
                    </h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(register.openedAt), 'HH:mm', { locale: es })}
                    </p>
                  </div>
                  {register.status === 'OPEN' ? (
                    <Badge variant="success">Abierta</Badge>
                  ) : (
                    <Badge variant="secondary">Cerrada</Badge>
                  )}
                </div>

                {/* Fecha de Cierre */}
                {register.closedAt && (
                  <div className="flex items-center gap-1.5 p-2 bg-muted/50 rounded-md">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Cierre:</span>
                    <span className="text-sm font-medium">
                      {format(new Date(register.closedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </span>
                  </div>
                )}

                {/* Grid de Información 2x2 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Ventas</p>
                    <p className="font-semibold mt-0.5 text-brand-success">
                      {formatCurrency(register.totalSales)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cantidad</p>
                    <p className="font-medium mt-0.5">
                      {register.salesCount} {register.salesCount === 1 ? 'venta' : 'ventas'}
                    </p>
                  </div>
                  {register.status === 'CLOSED' && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-1.5">Diferencia</p>
                      <div className="flex items-center gap-2">
                        {difference > 0 ? (
                          <>
                            <TrendingUp className="h-4 w-4 text-success" strokeWidth={1.75} />
                            <Badge
                              variant={hasDifference ? 'success' : 'secondary'}
                              className="text-sm"
                            >
                              +{formatCurrency(difference)}
                            </Badge>
                          </>
                        ) : difference < 0 ? (
                          <>
                            <TrendingDown className="h-4 w-4 text-destructive" strokeWidth={1.75} />
                            <Badge
                              variant={hasDifference ? 'destructive' : 'secondary'}
                              className="text-sm"
                            >
                              {formatCurrency(difference)}
                            </Badge>
                          </>
                        ) : (
                          <Badge variant="secondary" className="text-sm">$ 0</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Botón de Acción */}
                {register.status === 'CLOSED' && (
                  <Button
                    variant="outline"
                    className="w-full h-11"
                    onClick={() => onViewReport(register.id)}
                  >
                    <FileText className="h-4 w-4 mr-2" strokeWidth={1.75} />
                    Ver Reporte
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Vista Desktop - Tabla */}
      <ResponsiveTable className="hidden md:block rounded-md border">
      <div style={{ minWidth: '900px' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha Apertura</TableHead>
              <TableHead>Fecha Cierre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total Ventas</TableHead>
              <TableHead className="text-right">Ventas</TableHead>
              <TableHead className="text-right">Diferencia</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
        <TableBody>
          {registers.map((register) => {
            const difference = register.difference || 0;
            const hasDifference = Math.abs(difference) > 100; // Más de $100
            
            return (
              <TableRow key={register.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {format(new Date(register.openedAt), 'dd/MM/yyyy', { locale: es })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(register.openedAt), 'HH:mm', { locale: es })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {register.closedAt ? (
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {format(new Date(register.closedAt), 'dd/MM/yyyy', { locale: es })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(register.closedAt), 'HH:mm', { locale: es })}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {register.status === 'OPEN' ? (
                    <Badge variant="success">
                      Abierta
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Cerrada</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(register.totalSales)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {register.salesCount} {register.salesCount === 1 ? 'venta' : 'ventas'}
                </TableCell>
                <TableCell className="text-right">
                  {register.status === 'CLOSED' ? (
                    <div className="flex items-center justify-end gap-1">
                      {difference > 0 ? (
                        <>
                          <TrendingUp className="h-3 w-3 text-success" />
                          <Badge
                            variant={hasDifference ? 'success' : 'secondary'}
                          >
                            +{formatCurrency(difference)}
                          </Badge>
                        </>
                      ) : difference < 0 ? (
                        <>
                          <TrendingDown className="h-3 w-3 text-destructive" />
                          <Badge variant={hasDifference ? 'destructive' : 'secondary'}>
                            {formatCurrency(difference)}
                          </Badge>
                        </>
                      ) : (
                        <Badge variant="secondary">$ 0</Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {register.status === 'CLOSED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewReport(register.id)}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Ver Reporte
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </div>
    </ResponsiveTable>
    </>
  );
}
