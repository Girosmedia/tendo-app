'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { format } from 'date-fns';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils/dashboard-helpers';

const quoteLineSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  quantity: z.number().positive('Debe ser mayor a 0'),
  unitPrice: z.number().nonnegative('No puede ser negativo'),
});

const quoteFormSchema = z.object({
  customerId: z.string().optional(),
  dueAt: z.string().optional(),
  notes: z.string().max(5000).optional(),
  items: z.array(quoteLineSchema).min(1, 'Debes agregar al menos un ítem'),
});

type QuoteFormValues = z.infer<typeof quoteFormSchema>;

interface QuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CustomerOption {
  id: string;
  name: string;
  company: string | null;
}

export function QuoteDialog({ open, onOpenChange }: QuoteDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [hasLoadedCustomers, setHasLoadedCustomers] = useState(false);

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      customerId: undefined,
      dueAt: '',
      notes: '',
      items: [{ name: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const watchedItems = form.watch('items');

  const total = useMemo(() => {
    return watchedItems.reduce((sum, item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unitPrice || 0);
      return sum + quantity * unitPrice;
    }, 0);
  }, [watchedItems]);

  const loadCustomers = async () => {
    if (hasLoadedCustomers) return;

    try {
      const response = await fetch('/api/customers');
      if (!response.ok) return;

      const data = await response.json();
      setCustomers(data.customers || []);
      setHasLoadedCustomers(true);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const addLine = () => {
    const current = form.getValues('items');
    form.setValue('items', [...current, { name: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeLine = (index: number) => {
    const current = form.getValues('items');
    if (current.length === 1) {
      toast.error('Debes mantener al menos un ítem');
      return;
    }

    form.setValue(
      'items',
      current.filter((_, idx) => idx !== index),
      { shouldValidate: true }
    );
  };

  const onSubmit = async (values: QuoteFormValues) => {
    setIsLoading(true);

    try {
      const dueAtISO = values.dueAt
        ? new Date(`${values.dueAt}T23:59:59-03:00`).toISOString()
        : undefined;

      const payload = {
        type: 'QUOTE',
        status: 'DRAFT',
        paymentMethod: 'TRANSFER',
        taxRate: 19,
        discount: 0,
        docPrefix: 'COT',
        customerId: values.customerId || null,
        dueAt: dueAtISO || null,
        notes: values.notes || null,
        items: values.items.map((item) => ({
          productId: null,
          sku: null,
          name: item.name,
          quantity: Number(item.quantity),
          unit: 'unidad',
          unitPrice: Number(item.unitPrice),
          discount: 0,
          taxRate: 19,
        })),
      };

      const response = await fetch('/api/services/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'No se pudo crear la cotización');
        return;
      }

      toast.success('Cotización creada exitosamente');
      form.reset({
        customerId: undefined,
        dueAt: '',
        notes: '',
        items: [{ name: '', quantity: 1, unitPrice: 0 }],
      });
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error('Error creating quote:', error);
      toast.error('Error al crear cotización');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          void loadCustomers();
        }
        onOpenChange(nextOpen);
      }}
    >
      <ResponsiveDialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Nueva Cotización</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Ingresa los ítems y define una fecha de vigencia para enviar al cliente.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente (opcional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                            {customer.company ? ` (${customer.company})` : ''}
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
                name="dueAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Válida hasta</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Ítems de la cotización</h3>
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar ítem
                </Button>
              </div>

              <div className="space-y-3">
                {watchedItems.map((_, index) => (
                  <div key={index} className="grid gap-2 md:grid-cols-12 items-start">
                    <FormField
                      control={form.control}
                      name={`items.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-6">
                          <FormControl>
                            <Input placeholder="Servicio o material" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormControl>
                            <Input
                              type="number"
                              min={0.001}
                              step={0.001}
                              value={field.value}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-3">
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step={1}
                              value={field.value}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="md:col-span-1"
                      onClick={() => removeLine(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Alcance, condiciones o comentarios para el cliente"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {form.watch('dueAt')
                  ? `Vigencia hasta ${format(new Date(`${form.watch('dueAt')}T12:00:00`), 'dd/MM/yyyy')}`
                  : 'Sin fecha de vigencia definida'}
              </p>
              <p className="text-lg font-semibold">Total: {formatCurrency(total)}</p>
            </div>

            <ResponsiveDialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Guardando...' : 'Crear Cotización'}
              </Button>
            </ResponsiveDialogFooter>
          </form>
        </Form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
