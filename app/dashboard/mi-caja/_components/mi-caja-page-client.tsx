'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calculator,
  Calendar,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';

interface OperationalExpense {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  amount: number;
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER';
  expenseDate: string;
  createdAt: string;
  cashRegisterId: string | null;
  cashRegister?: {
    id: string;
    status: 'OPEN' | 'CLOSED';
    openedAt: string;
  } | null;
}

interface TreasuryMovement {
  id: string;
  type: 'INFLOW' | 'OUTFLOW';
  category:
    | 'CAPITAL_INJECTION'
    | 'OWNER_WITHDRAWAL'
    | 'LOAN_IN'
    | 'LOAN_OUT'
    | 'ACCOUNT_PAYABLE_PAYMENT'
    | 'OTHER';
  source: 'CASH' | 'BANK' | 'TRANSFER' | 'OTHER';
  title: string;
  description: string | null;
  reference: string | null;
  amount: number;
  occurredAt: string;
}

const formSchema = z.object({
  title: z.string().min(2, 'El nombre del egreso debe tener al menos 2 caracteres'),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'OTHER']),
  expenseDateRaw: z.string().min(1, 'La fecha es requerida'),
});

type FormValues = z.infer<typeof formSchema>;

const movementFormSchema = z.object({
  type: z.enum(['INFLOW', 'OUTFLOW']),
  category: z.enum(['CAPITAL_INJECTION', 'OWNER_WITHDRAWAL', 'LOAN_IN', 'LOAN_OUT', 'OTHER']),
  source: z.enum(['CASH', 'BANK', 'TRANSFER', 'OTHER']),
  title: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  occurredAtRaw: z.string().min(1, 'La fecha es requerida'),
  reference: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

type MovementFormValues = z.infer<typeof movementFormSchema>;

const expenseCategories = [
  'Insumos',
  'Transporte',
  'Servicios básicos',
  'Arriendo',
  'Mantención',
  'Comisiones',
  'Otros',
];

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
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

function getPaymentMethodLabel(paymentMethod: string) {
  if (paymentMethod === 'CASH') return 'Efectivo';
  if (paymentMethod === 'CARD') return 'Tarjeta';
  if (paymentMethod === 'TRANSFER') return 'Transferencia';
  return 'Otro';
}

function getTreasurySourceLabel(source: TreasuryMovement['source']) {
  if (source === 'CASH') return 'Caja';
  if (source === 'BANK') return 'Banco';
  if (source === 'TRANSFER') return 'Transferencia';
  return 'Otro';
}

export function MiCajaPageClient() {
  const [expenses, setExpenses] = useState<OperationalExpense[]>([]);
  const [movements, setMovements] = useState<TreasuryMovement[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingMovement, setIsSavingMovement] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<OperationalExpense | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      amount: 0,
      paymentMethod: 'CASH',
      expenseDateRaw: new Date().toISOString().slice(0, 10),
    },
  });

  const movementForm = useForm<MovementFormValues>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: {
      type: 'INFLOW',
      category: 'CAPITAL_INJECTION',
      source: 'BANK',
      title: '',
      amount: 0,
      occurredAtRaw: new Date().toISOString().slice(0, 10),
      reference: '',
      description: '',
    },
  });

  const filteredExpenses = useMemo(() => {
    if (!search.trim()) return expenses;
    const normalizedSearch = search.toLowerCase();
    return expenses.filter((expense) => {
      return (
        expense.title.toLowerCase().includes(normalizedSearch) ||
        expense.description?.toLowerCase().includes(normalizedSearch) ||
        expense.category?.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [expenses, search]);

  const filteredMovements = useMemo(() => {
    if (!search.trim()) return movements;
    const normalizedSearch = search.toLowerCase();
    return movements.filter((movement) => {
      return (
        movement.title.toLowerCase().includes(normalizedSearch) ||
        movement.description?.toLowerCase().includes(normalizedSearch) ||
        movement.reference?.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [movements, search]);

  const stats = useMemo(() => {
    const todayString = new Date().toISOString().slice(0, 10);

    return filteredExpenses.reduce(
      (acc, expense) => {
        const amount = Number(expense.amount);
        acc.totalMonth += amount;
        acc.count += 1;

        if (expense.paymentMethod === 'CASH') {
          acc.cashMonth += amount;
        }

        if (expense.expenseDate.slice(0, 10) === todayString) {
          acc.today += amount;
        }

        return acc;
      },
      {
        totalMonth: 0,
        today: 0,
        cashMonth: 0,
        count: 0,
      }
    );
  }, [filteredExpenses]);

  const treasuryStats = useMemo(() => {
    return filteredMovements.reduce(
      (acc, movement) => {
        const amount = Number(movement.amount);
        if (movement.type === 'INFLOW') acc.inflows += amount;
        if (movement.type === 'OUTFLOW') acc.outflows += amount;
        return acc;
      },
      { inflows: 0, outflows: 0 }
    );
  }, [filteredMovements]);

  const netCashMonth = treasuryStats.inflows - (stats.totalMonth + treasuryStats.outflows);

  async function loadExpenses() {
    const { startDate, endDate } = getMonthDateRange(selectedMonth);
    const params = new URLSearchParams({
      startDate,
      endDate,
    });

    if (search.trim()) {
      params.set('search', search.trim());
    }

    const response = await fetch(`/api/operational-expenses?${params.toString()}`);
    if (!response.ok) throw new Error('No se pudieron cargar los egresos');

    const data = await response.json();
    setExpenses((data.expenses || []).map((expense: any) => ({
      ...expense,
      amount: Number(expense.amount),
    })));
  }

  async function loadMovements() {
    const { startDate, endDate } = getMonthDateRange(selectedMonth);
    const params = new URLSearchParams({
      startDate,
      endDate,
    });

    if (search.trim()) {
      params.set('search', search.trim());
    }

    const response = await fetch(`/api/treasury-movements?${params.toString()}`);
    if (!response.ok) throw new Error('No se pudieron cargar los movimientos de tesorería');

    const data = await response.json();
    setMovements((data.movements || []).map((movement: any) => ({
      ...movement,
      amount: Number(movement.amount),
    })));
  }

  async function loadData() {
    setIsLoading(true);

    try {
      await Promise.all([loadExpenses(), loadMovements()]);
    } catch (error) {
      console.error(error);
      toast.error('No se pudieron cargar los datos de caja');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  function openCreateDialog() {
    setEditingExpense(null);
    form.reset({
      title: '',
      description: '',
      category: '',
      amount: 0,
      paymentMethod: 'CASH',
      expenseDateRaw: new Date().toISOString().slice(0, 10),
    });
    setDialogOpen(true);
  }

  function openCreateMovementDialog() {
    movementForm.reset({
      type: 'INFLOW',
      category: 'CAPITAL_INJECTION',
      source: 'BANK',
      title: '',
      amount: 0,
      occurredAtRaw: new Date().toISOString().slice(0, 10),
      reference: '',
      description: '',
    });
    setMovementDialogOpen(true);
  }

  function openEditDialog(expense: OperationalExpense) {
    setEditingExpense(expense);
    form.reset({
      title: expense.title,
      description: expense.description || '',
      category: expense.category || '',
      amount: Number(expense.amount),
      paymentMethod: expense.paymentMethod,
      expenseDateRaw: expense.expenseDate.slice(0, 10),
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: FormValues) {
    setIsSaving(true);

    try {
      const payload = {
        title: values.title,
        description: values.description || null,
        category: values.category || null,
        amount: Number(values.amount),
        paymentMethod: values.paymentMethod,
        expenseDate: new Date(`${values.expenseDateRaw}T12:00:00-03:00`).toISOString(),
      };

      const response = await fetch(
        editingExpense
          ? `/api/operational-expenses/${editingExpense.id}`
          : '/api/operational-expenses',
        {
          method: editingExpense ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'No se pudo guardar el egreso');
      }

      toast.success(editingExpense ? 'Egreso actualizado' : 'Egreso registrado');
      setDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el egreso');
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteExpense(expense: OperationalExpense) {
    const confirmed = window.confirm(`¿Eliminar el egreso "${expense.title}"?`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/operational-expenses/${expense.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'No se pudo eliminar el egreso');
      }

      toast.success('Egreso eliminado');
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el egreso');
    }
  }

  async function createMovement(values: MovementFormValues) {
    setIsSavingMovement(true);

    try {
      const payload = {
        type: values.type,
        category: values.category,
        source: values.source,
        title: values.title,
        amount: Number(values.amount),
        occurredAt: new Date(`${values.occurredAtRaw}T12:00:00-03:00`).toISOString(),
        reference: values.reference || null,
        description: values.description || null,
      };

      const response = await fetch('/api/treasury-movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'No se pudo registrar el movimiento');
      }

      toast.success('Movimiento de caja registrado');
      setMovementDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'No se pudo registrar el movimiento');
    } finally {
      setIsSavingMovement(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="h-6 w-6 md:h-8 md:w-8" />
            Mi Caja
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Registra egresos operacionales para medir la utilidad real
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
          <Button onClick={openCreateMovementDialog} variant="outline" className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Movimiento
          </Button>
          <Button onClick={openCreateDialog} className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Egreso
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Egresos Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalMonth)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Entradas Tesorería</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">{formatCurrency(treasuryStats.inflows)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Salidas Tesorería</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(treasuryStats.outflows)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Caja Neta Estimada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${netCashMonth >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(netCashMonth)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <CardTitle>Egresos Operacionales</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar egreso"
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="w-full sm:w-44"
              />
              <Button variant="outline" onClick={loadExpenses}>
                <Calendar className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Cargando egresos...
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-center">
              <p>No hay egresos registrados en el período seleccionado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="rounded-lg border p-3 md:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate">{expense.title}</p>
                      {expense.category && (
                        <Badge variant="secondary">{expense.category}</Badge>
                      )}
                      <Badge variant="outline">{getPaymentMethodLabel(expense.paymentMethod)}</Badge>
                      {expense.cashRegisterId && <Badge variant="success">Caja Activa</Badge>}
                    </div>
                    {expense.description && (
                      <p className="text-sm text-muted-foreground truncate">{expense.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(expense.expenseDate).toLocaleString('es-CL')}
                    </p>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-2">
                    <p className="text-lg md:text-xl font-bold text-destructive">
                      -{formatCurrency(Number(expense.amount))}
                    </p>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(expense)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteExpense(expense)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Movimientos de Tesorería</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-24 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Cargando movimientos...
            </div>
          ) : filteredMovements.length === 0 ? (
            <div className="h-24 flex items-center justify-center text-muted-foreground text-center">
              <p>No hay movimientos de tesorería en el período seleccionado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="rounded-lg border p-3 md:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate">{movement.title}</p>
                      <Badge variant={movement.type === 'INFLOW' ? 'success' : 'destructive'}>
                        {movement.type === 'INFLOW' ? 'Ingreso' : 'Salida'}
                      </Badge>
                      <Badge variant="outline">{getTreasurySourceLabel(movement.source)}</Badge>
                    </div>
                    {movement.description && (
                      <p className="text-sm text-muted-foreground truncate">{movement.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(movement.occurredAt).toLocaleString('es-CL')}
                      {movement.reference ? ` · Ref: ${movement.reference}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-2">
                    <p className={`text-lg md:text-xl font-bold ${movement.type === 'INFLOW' ? 'text-success' : 'text-destructive'}`}>
                      {movement.type === 'INFLOW' ? '+' : '-'}{formatCurrency(Number(movement.amount))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ResponsiveDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {editingExpense ? 'Editar Egreso' : 'Nuevo Egreso'}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Registra una salida de caja para reflejar costos reales del negocio.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Egreso</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Compra de bolsas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expenseDateRaw"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select value={field.value || 'none'} onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sin categoría</SelectItem>
                          {expenseCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medio de Pago</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CASH">Efectivo</SelectItem>
                          <SelectItem value="CARD">Tarjeta</SelectItem>
                          <SelectItem value="TRANSFER">Transferencia</SelectItem>
                          <SelectItem value="OTHER">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detalle adicional del egreso"
                        rows={3}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <ResponsiveDialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingExpense ? 'Guardar cambios' : 'Registrar egreso'}
                </Button>
              </ResponsiveDialogFooter>
            </form>
          </Form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ResponsiveDialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Nuevo Movimiento de Tesorería</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Registra ingresos o salidas no operacionales (inyección de capital, retiros, préstamos, etc.).
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <Form {...movementForm}>
            <form className="space-y-4" onSubmit={movementForm.handleSubmit(createMovement)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={movementForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="INFLOW">Ingreso</SelectItem>
                          <SelectItem value="OUTFLOW">Salida</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={movementForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CAPITAL_INJECTION">Inyección de capital</SelectItem>
                          <SelectItem value="OWNER_WITHDRAWAL">Retiro de socios</SelectItem>
                          <SelectItem value="LOAN_IN">Préstamo recibido</SelectItem>
                          <SelectItem value="LOAN_OUT">Pago de préstamo</SelectItem>
                          <SelectItem value="OTHER">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={movementForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del movimiento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Aporte de capital socios" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={movementForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={movementForm.control}
                  name="occurredAtRaw"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={movementForm.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origen</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CASH">Caja</SelectItem>
                          <SelectItem value="BANK">Banco</SelectItem>
                          <SelectItem value="TRANSFER">Transferencia</SelectItem>
                          <SelectItem value="OTHER">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={movementForm.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referencia</FormLabel>
                    <FormControl>
                      <Input placeholder="N° comprobante / transferencia" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={movementForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Detalle adicional" rows={3} {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <ResponsiveDialogFooter>
                <Button type="button" variant="outline" onClick={() => setMovementDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSavingMovement}>
                  {isSavingMovement && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Registrar movimiento
                </Button>
              </ResponsiveDialogFooter>
            </form>
          </Form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}