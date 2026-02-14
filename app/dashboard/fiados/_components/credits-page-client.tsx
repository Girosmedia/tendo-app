"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditsList } from "./credits-list";
import { CreateCreditDialog } from "./create-credit-dialog";
import { PaymentDialog } from "./payment-dialog";
import { CreditDetailsDialog } from "./credit-details-dialog";
import {
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

type Credit = {
  id: string;
  amount: number;
  balance: number;
  status: "ACTIVE" | "PAID" | "CANCELED" | "OVERDUE";
  dueDate: string;
  createdAt: string;
  description: string | null;
  notes: string | null;
  customer: {
    id: string;
    name: string;
    rut: string | null;
    email: string | null;
    phone: string | null;
    currentDebt: number;
    creditLimit: number | null;
  };
  document: {
    id: string;
    type: string;
    docNumber: number;
    docPrefix: string | null;
    total: number;
    issuedAt: string;
  } | null;
  payments: {
    id: string;
    amount: number;
    paymentMethod: string;
    paidAt: string;
  }[];
};

type Customer = {
  id: string;
  name: string;
  rut: string | null;
  creditLimit: number | null;
  currentDebt: number;
};

interface CreditsPageClientProps {
  credits: Credit[];
  customers: Customer[];
}

export function CreditsPageClient({
  credits,
  customers,
}: CreditsPageClientProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = React.useState(false);
  const [selectedCreditId, setSelectedCreditId] = React.useState<string>("");

  // Estadísticas
  const stats = React.useMemo(() => {
    const activeCredits = credits.filter(
      (c) => c.status === "ACTIVE" || c.status === "OVERDUE"
    );
    const totalPending = activeCredits.reduce(
      (sum, c) => sum + c.balance,
      0
    );
    const overdueCredits = credits.filter(
      (c) => c.status === "ACTIVE" && new Date(c.dueDate) < new Date()
    );
    const totalOverdue = overdueCredits.reduce((sum, c) => sum + c.balance, 0);
    const paidCredits = credits.filter((c) => c.status === "PAID");

    return {
      totalPending,
      activeCount: activeCredits.length,
      overdueCount: overdueCredits.length,
      totalOverdue,
      paidCount: paidCredits.length,
    };
  }, [credits]);

  // Filtrar créditos
  const filteredCredits = React.useMemo(() => {
    return credits.filter((credit) => {
      const matchesSearch = credit.customer.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        credit.status === statusFilter ||
        (statusFilter === "OVERDUE" &&
          credit.status === "ACTIVE" &&
          new Date(credit.dueDate) < new Date());

      return matchesSearch && matchesStatus;
    });
  }, [credits, searchQuery, statusFilter]);

  const selectedCredit = credits.find((c) => c.id === selectedCreditId);

  const handleViewDetails = (creditId: string) => {
    setSelectedCreditId(creditId);
    setDetailsDialogOpen(true);
  };

  const handleRegisterPayment = (creditId: string) => {
    setSelectedCreditId(creditId);
    setPaymentDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fiados</h1>
          <p className="text-muted-foreground">
            Gestión de créditos y cuentas por cobrar
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Crédito
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total por Cobrar
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalPending.toLocaleString("es-CL")}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.activeCount} crédito(s) activo(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ${stats.totalOverdue.toLocaleString("es-CL")}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.overdueCount} crédito(s) vencido(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagados</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {stats.paidCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Créditos totalmente pagados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(credits.map((c) => c.customer.id)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Con créditos registrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ACTIVE">Activos</SelectItem>
            <SelectItem value="OVERDUE">Vencidos</SelectItem>
            <SelectItem value="PAID">Pagados</SelectItem>
            <SelectItem value="CANCELED">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs por estado */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Activos ({credits.filter((c) => c.status === "ACTIVE" || c.status === "OVERDUE").length})
          </TabsTrigger>
          <TabsTrigger value="paid">
            Pagados ({stats.paidCount})
          </TabsTrigger>
          <TabsTrigger value="all">
            Todos ({credits.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <CreditsList
            credits={filteredCredits.filter(
              (c) => c.status === "ACTIVE" || c.status === "OVERDUE"
            )}
            onViewDetails={handleViewDetails}
            onRegisterPayment={handleRegisterPayment}
          />
        </TabsContent>

        <TabsContent value="paid">
          <CreditsList
            credits={filteredCredits.filter((c) => c.status === "PAID")}
            onViewDetails={handleViewDetails}
            onRegisterPayment={handleRegisterPayment}
          />
        </TabsContent>

        <TabsContent value="all">
          <CreditsList
            credits={filteredCredits}
            onViewDetails={handleViewDetails}
            onRegisterPayment={handleRegisterPayment}
          />
        </TabsContent>
      </Tabs>

      {/* Diálogos */}
      <CreateCreditDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        customers={customers}
      />

      {selectedCredit && (
        <>
          <PaymentDialog
            open={paymentDialogOpen}
            onOpenChange={setPaymentDialogOpen}
            creditId={selectedCredit.id}
            creditBalance={selectedCredit.balance}
            customerName={selectedCredit.customer.name}
          />

          <CreditDetailsDialog
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
            credit={
              {
                ...selectedCredit,
                dueDate: new Date(selectedCredit.dueDate),
                createdAt: new Date(selectedCredit.createdAt),
                document: selectedCredit.document
                  ? {
                      ...selectedCredit.document,
                      issuedAt: new Date(selectedCredit.document.issuedAt),
                    }
                  : null,
                payments: selectedCredit.payments.map((p) => ({
                  ...p,
                  paidAt: new Date(p.paidAt),
                })),
              } as any
            }
          />
        </>
      )}
    </div>
  );
}
