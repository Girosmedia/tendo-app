'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  CalendarClock,
  Loader2,
  Plus,
  Search,
  Truck,
  Wallet,
  AlertTriangle,
  Pencil,
  HandCoins,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { Textarea } from '@/components/ui/textarea';

interface Supplier {
  id: string;
  name: string;
  rut: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

interface AccountPayable {
  id: string;
  supplierId: string;
  documentType: 'INVOICE' | 'RECEIPT' | 'OTHER';
  documentNumber: string | null;
  issueDate: string;
  dueDate: string;
  amount: number;
  balance: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELED';
  description: string | null;
  notes: string | null;
  createdAt: string;
  supplier: {
    id: string;
    name: string;
    rut: string | null;
    status: 'ACTIVE' | 'INACTIVE';
  };
}

const supplierFormSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  rut: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  email: z.string().email('Correo inválido').optional().or(z.literal('')).nullable(),
  phone: z.string().optional().nullable(),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

const payableFormSchema = z.object({
  supplierId: z.string().min(1, 'Debes seleccionar un proveedor'),
  documentType: z.enum(['INVOICE', 'RECEIPT', 'OTHER']),
  documentNumber: z.string().optional().nullable(),
  issueDateRaw: z.string().min(1, 'La fecha de emisión es requerida'),
  dueDateRaw: z.string().min(1, 'La fecha de vencimiento es requerida'),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type PayableFormValues = z.infer<typeof payableFormSchema>;

const paymentFormSchema = z.object({
  paymentAmount: z.number().positive('El monto del pago debe ser mayor a 0'),
  paidAtRaw: z.string().min(1, 'La fecha de pago es requerida'),
  source: z.enum(['CASH', 'BANK', 'TRANSFER', 'OTHER']),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
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
  };
}

function getStatusLabel(status: AccountPayable['status']) {
  if (status === 'PENDING') return 'Pendiente';
  if (status === 'PARTIAL') return 'Abonada';
  if (status === 'PAID') return 'Pagada';
  if (status === 'OVERDUE') return 'Vencida';
  return 'Anulada';
}

function getStatusVariant(status: AccountPayable['status']): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'OVERDUE') return 'destructive';
  if (status === 'PENDING') return 'default';
  if (status === 'PARTIAL') return 'secondary';
  return 'outline';
}

export function PorPagarPageClient() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [payables, setPayables] = useState<AccountPayable[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  const [appliedMonth, setAppliedMonth] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | AccountPayable['status']>('ALL');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSupplier, setIsSavingSupplier] = useState(false);
  const [isSavingPayable, setIsSavingPayable] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [payableDialogOpen, setPayableDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const [editingPayable, setEditingPayable] = useState<AccountPayable | null>(null);
  const [selectedPayable, setSelectedPayable] = useState<AccountPayable | null>(null);

  const supplierForm = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: '',
      rut: '',
      contactName: '',
      email: '',
      phone: '',
    },
  });

  const payableForm = useForm<PayableFormValues>({
    resolver: zodResolver(payableFormSchema),
    defaultValues: {
      supplierId: '',
      documentType: 'INVOICE',
      documentNumber: '',
      issueDateRaw: new Date().toISOString().slice(0, 10),
      dueDateRaw: new Date().toISOString().slice(0, 10),
      amount: 0,
      description: '',
      notes: '',
    },
  });

  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentAmount: 0,
      paidAtRaw: new Date().toISOString().slice(0, 10),
      source: 'BANK',
      reference: '',
      notes: '',
    },
  });

  const stats = useMemo(() => {
    const today = new Date();
    const in7Days = new Date();
    in7Days.setDate(today.getDate() + 7);

    return payables.reduce(
      (acc, payable) => {
        const balance = Number(payable.balance);
        const dueDate = new Date(payable.dueDate);

        if (payable.status === 'PENDING' || payable.status === 'PARTIAL' || payable.status === 'OVERDUE') {
          acc.totalPending += balance;
        }

        if (payable.status === 'OVERDUE') {
          acc.totalOverdue += balance;
        }

        if ((payable.status === 'PENDING' || payable.status === 'PARTIAL') && dueDate >= today && dueDate <= in7Days) {
          acc.dueSoon += balance;
        }

        return acc;
      },
      {
        totalPending: 0,
        totalOverdue: 0,
        dueSoon: 0,
      }
    );
  }, [payables]);

  async function loadSuppliers() {
    const response = await fetch('/api/suppliers');
    if (!response.ok) {
      throw new Error('No se pudieron cargar los proveedores');
    }

    const data = await response.json();
    setSuppliers(data.suppliers || []);
  }

  async function loadPayables(monthFilter: string | null = appliedMonth) {
    const params = new URLSearchParams();

    if (monthFilter) {
      const { startDate, endDate } = getMonthDateRange(monthFilter);
      params.set('startDueDate', startDate);
      params.set('endDueDate', endDate);
    }

    if (selectedStatus !== 'ALL') {
      params.set('status', selectedStatus);
    }

    if (selectedSupplierId !== 'ALL') {
      params.set('supplierId', selectedSupplierId);
    }

    if (search.trim()) {
      params.set('search', search.trim());
    }

    const response = await fetch(`/api/accounts-payable?${params.toString()}`);
    if (!response.ok) {
      throw new Error('No se pudieron cargar las cuentas por pagar');
    }

    const data = await response.json();
    setPayables(
      (data.payables || []).map((payable: AccountPayable & { amount: number | string; balance: number | string }) => ({
        ...payable,
        amount: Number(payable.amount),
        balance: Number(payable.balance),
      }))
    );
  }

  async function loadData() {
    setIsLoading(true);
    try {
      await Promise.all([loadSuppliers(), loadPayables()]);
    } catch (error) {
      console.error(error);
      toast.error('No se pudo cargar Por Pagar');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedMonth, selectedStatus, selectedSupplierId]);

  function applyFilters() {
    const nextMonth = selectedMonth || null;
    setAppliedMonth(nextMonth);
    void loadPayables(nextMonth);
  }

  function clearMonthFilter() {
    const nextMonth = null;
    setAppliedMonth(null);
    void loadPayables(nextMonth);
  }

  function openCreatePayableDialog() {
    if (suppliers.length === 0) {
      toast.error('Primero debes crear al menos un proveedor');
      return;
    }

    setEditingPayable(null);
    payableForm.reset({
      supplierId: suppliers[0]?.id || '',
      documentType: 'INVOICE',
      documentNumber: '',
      issueDateRaw: new Date().toISOString().slice(0, 10),
      dueDateRaw: new Date().toISOString().slice(0, 10),
      amount: 0,
      description: '',
      notes: '',
    });
    setPayableDialogOpen(true);
  }

  function openEditPayableDialog(payable: AccountPayable) {
    setEditingPayable(payable);
    payableForm.reset({
      supplierId: payable.supplierId,
      documentType: payable.documentType,
      documentNumber: payable.documentNumber || '',
      issueDateRaw: payable.issueDate.slice(0, 10),
      dueDateRaw: payable.dueDate.slice(0, 10),
      amount: payable.amount,
      description: payable.description || '',
      notes: payable.notes || '',
    });
    setPayableDialogOpen(true);
  }

  function openPaymentDialog(payable: AccountPayable) {
    setSelectedPayable(payable);
    paymentForm.reset({
      paymentAmount: Number(payable.balance),
      paidAtRaw: new Date().toISOString().slice(0, 10),
      source: 'BANK',
      reference: '',
      notes: '',
    });
    setPaymentDialogOpen(true);
  }

  async function createSupplier(values: SupplierFormValues) {
    setIsSavingSupplier(true);
    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          rut: values.rut || null,
          contactName: values.contactName || null,
          email: values.email || null,
          phone: values.phone || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'No se pudo crear el proveedor');
      }

      toast.success('Proveedor creado');
      setSupplierDialogOpen(false);
      supplierForm.reset();
      await loadSuppliers();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'No se pudo crear el proveedor');
    } finally {
      setIsSavingSupplier(false);
    }
  }

  async function savePayable(values: PayableFormValues) {
    setIsSavingPayable(true);
    try {
      const payload = {
        supplierId: values.supplierId,
        documentType: values.documentType,
        documentNumber: values.documentNumber || null,
        issueDate: new Date(`${values.issueDateRaw}T12:00:00-03:00`).toISOString(),
        dueDate: new Date(`${values.dueDateRaw}T12:00:00-03:00`).toISOString(),
        amount: Number(values.amount),
        description: values.description || null,
        notes: values.notes || null,
      };

      const response = await fetch(
        editingPayable ? `/api/accounts-payable/${editingPayable.id}` : '/api/accounts-payable',
        {
          method: editingPayable ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'No se pudo guardar la cuenta por pagar');
      }

      toast.success(editingPayable ? 'Cuenta actualizada' : 'Cuenta por pagar registrada');
      setPayableDialogOpen(false);
      await loadPayables();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar la cuenta por pagar'
      );
    } finally {
      setIsSavingPayable(false);
    }
  }

  async function registerPayment(values: PaymentFormValues) {
    if (!selectedPayable) return;

    setIsSavingPayment(true);
    try {
      const response = await fetch(`/api/accounts-payable/${selectedPayable.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentAmount: Number(values.paymentAmount),
          paidAt: new Date(`${values.paidAtRaw}T12:00:00-03:00`).toISOString(),
          source: values.source,
          reference: values.reference || null,
          notes: values.notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'No se pudo registrar el pago');
      }

      toast.success('Pago registrado correctamente');
      setPaymentDialogOpen(false);
      setSelectedPayable(null);
      await loadPayables();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'No se pudo registrar el pago');
    } finally {
      setIsSavingPayment(false);
    }
  }

  async function deletePayable(payable: AccountPayable) {
    const confirmed = window.confirm('¿Eliminar esta cuenta por pagar?');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/accounts-payable/${payable.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'No se pudo eliminar la cuenta por pagar');
      }

      toast.success('Cuenta por pagar eliminada');
      await loadPayables();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo eliminar la cuenta por pagar'
      );
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl'>
            <Wallet className='h-6 w-6 md:h-8 md:w-8' />
            Por Pagar
          </h1>
          <p className='mt-0.5 text-sm text-muted-foreground'>
            Controla proveedores, cuentas pendientes y vencimientos
          </p>
        </div>

        <div className='flex w-full flex-col gap-2 md:w-auto md:flex-row'>
          <Button variant='outline' onClick={() => setSupplierDialogOpen(true)}>
            <Truck className='mr-2 h-4 w-4' />
            Nuevo Proveedor
          </Button>
          <Button onClick={openCreatePayableDialog}>
            <Plus className='mr-2 h-4 w-4' />
            Nueva Cuenta
          </Button>
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Pendiente Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{formatCurrency(stats.totalPending)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Monto Vencido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold text-destructive'>{formatCurrency(stats.totalOverdue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Vence en 7 días</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{formatCurrency(stats.dueSoon)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Proveedores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{suppliers.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className='flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between'>
            <CardTitle>Cuentas por Pagar</CardTitle>
            <div className='flex flex-col gap-2 sm:flex-row'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder='Buscar cuenta o proveedor'
                  className='w-full pl-9 sm:w-64'
                />
              </div>

              <Select
                value={selectedStatus}
                onValueChange={(value: 'ALL' | AccountPayable['status']) => setSelectedStatus(value)}
              >
                <SelectTrigger className='w-full sm:w-40'>
                  <SelectValue placeholder='Estado' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ALL'>Todos</SelectItem>
                  <SelectItem value='PENDING'>Pendiente</SelectItem>
                  <SelectItem value='PARTIAL'>Abonada</SelectItem>
                  <SelectItem value='OVERDUE'>Vencida</SelectItem>
                  <SelectItem value='PAID'>Pagada</SelectItem>
                  <SelectItem value='CANCELED'>Anulada</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger className='w-full sm:w-48'>
                  <SelectValue placeholder='Proveedor' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ALL'>Todos</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type='month'
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className='w-full sm:w-44'
              />

              <Button variant='outline' onClick={applyFilters}>
                Filtrar
              </Button>

              <Button variant='ghost' onClick={clearMonthFilter}>
                Ver todo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex items-center justify-center py-16'>
              <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
            </div>
          ) : payables.length === 0 ? (
            <div className='rounded-lg border border-dashed p-8 text-center'>
              <CalendarClock className='mx-auto mb-2 h-6 w-6 text-muted-foreground' />
              <p className='text-sm text-muted-foreground'>
                No hay cuentas por pagar para este período.
              </p>
            </div>
          ) : (
            <>
              <div className='space-y-3 md:hidden'>
                {payables.map((payable) => (
                  <div key={payable.id} className='rounded-lg border p-4'>
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <p className='font-semibold'>{payable.supplier.name}</p>
                        <p className='text-sm text-muted-foreground'>
                          {payable.documentType === 'INVOICE'
                            ? 'Factura'
                            : payable.documentType === 'RECEIPT'
                              ? 'Boleta'
                              : 'Otro'}
                          {' · '}
                          {payable.documentNumber || 'Sin número'}
                        </p>
                      </div>
                      <Badge variant={getStatusVariant(payable.status)}>
                        {getStatusLabel(payable.status)}
                      </Badge>
                    </div>

                    <div className='mt-3 grid grid-cols-2 gap-2 text-sm'>
                      <div>
                        <p className='text-muted-foreground'>Vencimiento</p>
                        <p>{formatDate(payable.dueDate)}</p>
                      </div>
                      <div>
                        <p className='text-muted-foreground'>Emisión</p>
                        <p>{formatDate(payable.issueDate)}</p>
                      </div>
                      <div>
                        <p className='text-muted-foreground'>Monto</p>
                        <p>{formatCurrency(payable.amount)}</p>
                      </div>
                      <div>
                        <p className='text-muted-foreground'>Saldo</p>
                        <p className='font-semibold'>{formatCurrency(payable.balance)}</p>
                      </div>
                    </div>

                    <div className='mt-3 flex items-center justify-end gap-1'>
                      {(payable.status === 'PENDING' || payable.status === 'PARTIAL' || payable.status === 'OVERDUE') ? (
                        <Button
                          size='icon'
                          variant='ghost'
                          onClick={() => openPaymentDialog(payable)}
                          title='Registrar pago'
                        >
                          <HandCoins className='h-4 w-4' />
                        </Button>
                      ) : null}
                      <Button
                        size='icon'
                        variant='ghost'
                        onClick={() => openEditPayableDialog(payable)}
                        title='Editar'
                      >
                        <Pencil className='h-4 w-4' />
                      </Button>
                      <Button
                        size='icon'
                        variant='ghost'
                        onClick={() => deletePayable(payable)}
                        title='Eliminar'
                      >
                        <Trash2 className='h-4 w-4 text-destructive' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className='hidden md:block overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className='text-right'>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payables.map((payable) => (
                      <TableRow key={payable.id}>
                        <TableCell>
                          <div className='font-medium'>{payable.supplier.name}</div>
                          {payable.supplier.rut ? (
                            <p className='text-xs text-muted-foreground'>{payable.supplier.rut}</p>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <div className='font-medium'>
                            {payable.documentType === 'INVOICE'
                              ? 'Factura'
                              : payable.documentType === 'RECEIPT'
                                ? 'Boleta'
                                : 'Otro'}
                          </div>
                          <p className='text-xs text-muted-foreground'>
                            {payable.documentNumber || 'Sin número'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div>{formatDate(payable.dueDate)}</div>
                          <p className='text-xs text-muted-foreground'>
                            Emisión: {formatDate(payable.issueDate)}
                          </p>
                        </TableCell>
                        <TableCell>{formatCurrency(payable.amount)}</TableCell>
                        <TableCell className='font-semibold'>
                          {formatCurrency(payable.balance)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(payable.status)}>
                            {getStatusLabel(payable.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='flex items-center justify-end gap-1'>
                            {(payable.status === 'PENDING' || payable.status === 'PARTIAL' || payable.status === 'OVERDUE') ? (
                              <Button
                                size='icon'
                                variant='ghost'
                                onClick={() => openPaymentDialog(payable)}
                                title='Registrar pago'
                              >
                                <HandCoins className='h-4 w-4' />
                              </Button>
                            ) : null}
                            <Button
                              size='icon'
                              variant='ghost'
                              onClick={() => openEditPayableDialog(payable)}
                              title='Editar'
                            >
                              <Pencil className='h-4 w-4' />
                            </Button>
                            <Button
                              size='icon'
                              variant='ghost'
                              onClick={() => deletePayable(payable)}
                              title='Eliminar'
                            >
                              <Trash2 className='h-4 w-4 text-destructive' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ResponsiveDialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Nuevo Proveedor</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Crea el proveedor para asociarlo a tus cuentas por pagar.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <Form {...supplierForm}>
            <form onSubmit={supplierForm.handleSubmit(createSupplier)} className='space-y-4'>
              <FormField
                control={supplierForm.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='Proveedor SpA' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={supplierForm.control}
                  name='rut'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RUT</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder='76.123.456-7' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={supplierForm.control}
                  name='contactName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contacto</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder='Nombre contacto' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={supplierForm.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder='contacto@proveedor.cl' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={supplierForm.control}
                  name='phone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder='+56 9 1234 5678' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <ResponsiveDialogFooter>
                <Button type='button' variant='outline' onClick={() => setSupplierDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type='submit' disabled={isSavingSupplier}>
                  {isSavingSupplier ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                  Guardar Proveedor
                </Button>
              </ResponsiveDialogFooter>
            </form>
          </Form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ResponsiveDialog open={payableDialogOpen} onOpenChange={setPayableDialogOpen}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {editingPayable ? 'Editar Cuenta por Pagar' : 'Nueva Cuenta por Pagar'}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Registra documento, monto y vencimiento para controlar pagos.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <Form {...payableForm}>
            <form onSubmit={payableForm.handleSubmit(savePayable)} className='space-y-4'>
              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={payableForm.control}
                  name='supplierId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proveedor *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Seleccionar proveedor' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={payableForm.control}
                  name='documentType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo Documento</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Tipo' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='INVOICE'>Factura</SelectItem>
                          <SelectItem value='RECEIPT'>Boleta</SelectItem>
                          <SelectItem value='OTHER'>Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={payableForm.control}
                  name='documentNumber'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número Documento</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder='F-000123' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={payableForm.control}
                  name='amount'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto *</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          step={1}
                          min={0}
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={payableForm.control}
                  name='issueDateRaw'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Emisión *</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={payableForm.control}
                  name='dueDateRaw'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Vencimiento *</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={payableForm.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} placeholder='Compra de mercadería febrero' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={payableForm.control}
                name='notes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ''} placeholder='Detalle interno de pago o acuerdo' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <ResponsiveDialogFooter>
                <Button type='button' variant='outline' onClick={() => setPayableDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type='submit' disabled={isSavingPayable}>
                  {isSavingPayable ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                  {editingPayable ? 'Guardar Cambios' : 'Registrar Cuenta'}
                </Button>
              </ResponsiveDialogFooter>
            </form>
          </Form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ResponsiveDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Registrar Pago</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {selectedPayable ? (
                <span>
                  Saldo pendiente actual: {formatCurrency(Number(selectedPayable.balance))}
                </span>
              ) : null}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(registerPayment)} className='space-y-4'>
              <FormField
                control={paymentForm.control}
                name='paymentAmount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto del pago *</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={0}
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
                control={paymentForm.control}
                name='paidAtRaw'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de pago *</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={paymentForm.control}
                name='source'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origen del pago *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Selecciona origen' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='CASH'>Caja</SelectItem>
                        <SelectItem value='BANK'>Banco</SelectItem>
                        <SelectItem value='TRANSFER'>Transferencia</SelectItem>
                        <SelectItem value='OTHER'>Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={paymentForm.control}
                name='reference'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referencia</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} placeholder='N° transferencia / comprobante' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={paymentForm.control}
                name='notes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ''} placeholder='Referencia del pago' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <ResponsiveDialogFooter>
                <Button type='button' variant='outline' onClick={() => setPaymentDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type='submit' disabled={isSavingPayment}>
                  {isSavingPayment ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                  Registrar Pago
                </Button>
              </ResponsiveDialogFooter>
            </form>
          </Form>

          {selectedPayable?.status === 'OVERDUE' ? (
            <div className='flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive'>
              <AlertTriangle className='h-4 w-4' />
              Esta cuenta está vencida. Prioriza su regularización.
            </div>
          ) : null}
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}
