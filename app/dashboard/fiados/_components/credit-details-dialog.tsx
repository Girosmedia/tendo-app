"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, DollarSign, FileText } from "lucide-react";

type CreditDetails = {
  id: string;
  amount: number;
  balance: number;
  status: "ACTIVE" | "PAID" | "CANCELED" | "OVERDUE";
  dueDate: Date;
  createdAt: Date;
  description: string | null;
  notes: string | null;
  customer: {
    id: string;
    name: string;
    rut: string | null;
    email: string | null;
    phone: string | null;
  };
  document: {
    id: string;
    type: string;
    docNumber: number;
    docPrefix: string | null;
    total: number;
  } | null;
  payments: {
    id: string;
    amount: number;
    paymentMethod: string;
    reference: string | null;
    paidAt: Date;
  }[];
};

interface CreditDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credit: CreditDetails | null;
}

const statusLabels = {
  ACTIVE: "Activo",
  PAID: "Pagado",
  CANCELED: "Cancelado",
  OVERDUE: "Vencido",
};

const paymentMethodLabels: Record<string, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  CHECK: "Cheque",
  OTHER: "Otro",
};

export function CreditDetailsDialog({
  open,
  onOpenChange,
  credit,
}: CreditDetailsDialogProps) {
  if (!credit) return null;

  const isOverdue =
    credit.status === "ACTIVE" && new Date(credit.dueDate) < new Date();
  const totalPaid = credit.payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Crédito</DialogTitle>
          <DialogDescription>
            Información completa y historial de pagos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del cliente */}
          <div>
            <h3 className="font-semibold mb-2">Cliente</h3>
            <div className="space-y-1 text-sm">
              <div>
                <span className="font-medium">{credit.customer.name}</span>
              </div>
              {credit.customer.rut && <div>RUT: {credit.customer.rut}</div>}
              {credit.customer.email && (
                <div>Email: {credit.customer.email}</div>
              )}
              {credit.customer.phone && (
                <div>Teléfono: {credit.customer.phone}</div>
              )}
            </div>
          </div>

          <Separator />

          {/* Resumen del crédito */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Monto Original
              </div>
              <div className="text-2xl font-bold">
                ${Number(credit.amount).toLocaleString("es-CL")}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Saldo Pendiente
              </div>
              <div className="text-2xl font-bold text-orange-600">
                ${Number(credit.balance).toLocaleString("es-CL")}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Estado</div>
              <Badge variant={isOverdue ? "destructive" : "default"}>
                {isOverdue ? "Vencido" : statusLabels[credit.status]}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Vencimiento
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(credit.dueDate), "dd MMM yyyy", {
                  locale: es,
                })}
              </div>
            </div>
          </div>

          <Separator />

          {/* Documento asociado */}
          {credit.document && (
            <>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documento Asociado
                </h3>
                <div className="text-sm space-y-1">
                  <div>
                    Tipo: {credit.document.type} #{credit.document.docNumber}
                  </div>
                  <div>
                    Total: ${Number(credit.document.total).toLocaleString("es-CL")}
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Descripción */}
          {credit.description && (
            <>
              <div>
                <h3 className="font-semibold mb-2">Descripción</h3>
                <p className="text-sm">{credit.description}</p>
              </div>
              <Separator />
            </>
          )}

          {/* Historial de pagos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Historial de Pagos ({credit.payments.length})
              </h3>
              <div className="text-sm text-muted-foreground">
                Total pagado: ${totalPaid.toLocaleString("es-CL")}
              </div>
            </div>

            {credit.payments.length === 0 ? (
              <div className="text-center p-8 border rounded-lg text-muted-foreground">
                No hay pagos registrados
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Referencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {credit.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {format(new Date(payment.paidAt), "dd/MM/yyyy HH:mm", {
                            locale: es,
                          })}
                        </TableCell>
                        <TableCell className="font-medium">
                          ${Number(payment.amount).toLocaleString("es-CL")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {paymentMethodLabels[payment.paymentMethod] ||
                              payment.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.reference || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Notas internas */}
          {credit.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Notas Internas</h3>
                <p className="text-sm text-muted-foreground">{credit.notes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
