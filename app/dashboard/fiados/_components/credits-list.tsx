"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { Eye, DollarSign, AlertTriangle, Calendar } from "lucide-react";

type Credit = {
  id: string;
  amount: number;
  balance: number;
  status: "ACTIVE" | "PAID" | "CANCELED" | "OVERDUE";
  dueDate: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    rut: string | null;
  };
  payments: {
    id: string;
    amount: number;
    paidAt: string;
  }[];
};

interface CreditsListProps {
  credits: Credit[];
  onViewDetails: (creditId: string) => void;
  onRegisterPayment: (creditId: string) => void;
}

const statusConfig = {
  ACTIVE: {
    label: "Activo",
    variant: "default" as const,
  },
  PAID: {
    label: "Pagado",
    variant: "secondary" as const,
  },
  CANCELED: {
    label: "Cancelado",
    variant: "outline" as const,
  },
  OVERDUE: {
    label: "Vencido",
    variant: "destructive" as const,
  },
};

export function CreditsList({
  credits,
  onViewDetails,
  onRegisterPayment,
}: CreditsListProps) {
  if (credits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg">
        <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No hay créditos registrados</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Los créditos otorgados aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Vista Móvil - Cards */}
      <div className="md:hidden space-y-3">
        {credits.map((credit) => {
          const isOverdue =
            credit.status === "ACTIVE" &&
            new Date(credit.dueDate) < new Date();
          const statusKey = isOverdue
            ? "OVERDUE"
            : (credit.status as keyof typeof statusConfig);

          return (
            <Card key={credit.id}>
              <CardContent className="p-4 space-y-4">
                {/* Header: Cliente + Estado */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-base truncate">
                      {credit.customer.name}
                    </h4>
                    {credit.customer.rut && (
                      <p className="text-sm text-muted-foreground">
                        {credit.customer.rut}
                      </p>
                    )}
                  </div>
                  <Badge variant={statusConfig[statusKey].variant}>
                    {statusConfig[statusKey].label}
                  </Badge>
                </div>

                {/* Grid de Información 2x2 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Monto Original</p>
                    <p className="font-medium mt-0.5">
                      ${Number(credit.amount).toLocaleString("es-CL")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Saldo Pendiente</p>
                    <p className="font-semibold mt-0.5 text-warning">
                      ${Number(credit.balance).toLocaleString("es-CL")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Vencimiento
                    </p>
                    <p
                      className={`font-medium mt-0.5 flex items-center gap-1 ${
                        isOverdue ? "text-destructive" : ""
                      }`}
                    >
                      {isOverdue && (
                        <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
                      )}
                      {format(new Date(credit.dueDate), "dd MMM yyyy", {
                        locale: es,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pagos</p>
                    <p className="font-medium mt-0.5">
                      {credit.payments.length} pago(s)
                    </p>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-11"
                    onClick={() => onViewDetails(credit.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" strokeWidth={1.75} />
                    Ver Detalles
                  </Button>
                  {(credit.status === "ACTIVE" ||
                    credit.status === "OVERDUE") &&
                    credit.balance > 0 && (
                      <Button
                        variant="default"
                        className="flex-1 h-11"
                        onClick={() => onRegisterPayment(credit.id)}
                      >
                        <DollarSign className="h-4 w-4 mr-2" strokeWidth={1.75} />
                        Pagar
                      </Button>
                    )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Vista Desktop - Tabla */}
      <ResponsiveTable className="hidden md:block border rounded-lg">
      <div style={{ minWidth: '900px' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Monto Original</TableHead>
              <TableHead>Saldo Pendiente</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Pagos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
        <TableBody>
          {credits.map((credit) => {
            const isOverdue =
              credit.status === "ACTIVE" &&
              new Date(credit.dueDate) < new Date();
            const statusKey = isOverdue
              ? "OVERDUE"
              : (credit.status as keyof typeof statusConfig);

            return (
              <TableRow key={credit.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{credit.customer.name}</div>
                    {credit.customer.rut && (
                      <div className="text-xs text-muted-foreground">
                        {credit.customer.rut}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  ${Number(credit.amount).toLocaleString("es-CL")}
                </TableCell>
                <TableCell>
                  <span className="font-medium">
                    ${Number(credit.balance).toLocaleString("es-CL")}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {isOverdue && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                    <span className={isOverdue ? "text-destructive" : ""}>
                      {format(new Date(credit.dueDate), "dd MMM yyyy", {
                        locale: es,
                      })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusConfig[statusKey].variant}>
                    {statusConfig[statusKey].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {credit.payments.length} pago(s)
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(credit.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {(credit.status === "ACTIVE" ||
                      credit.status === "OVERDUE") &&
                      credit.balance > 0 && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => onRegisterPayment(credit.id)}
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Pagar
                        </Button>
                      )}
                  </div>
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
