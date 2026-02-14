'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, TrendingUp, TrendingDown } from 'lucide-react';

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
    <div className="rounded-md border">
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
  );
}
