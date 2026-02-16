'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const expenseFormSchema = z.object({
  milestoneId: z.string().optional(),
  description: z.string().min(2, 'La descripción debe tener al menos 2 caracteres').max(180),
  category: z.string().max(80).optional(),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  expenseDate: z.string().optional(),
  notes: z.string().max(5000).optional(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface ProjectExpenseDialogProps {
  projectId: string;
  milestones: Array<{ id: string; title: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'create' | 'edit';
  expenseId?: string;
  initialData?: {
    milestoneId: string | null;
    description: string;
    category: string | null;
    amount: number;
    expenseDate: string;
    notes: string | null;
  };
  onSaved: () => void;
}

export function ProjectExpenseDialog({
  projectId,
  milestones,
  open,
  onOpenChange,
  mode = 'create',
  expenseId,
  initialData,
  onSaved,
}: ProjectExpenseDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = mode === 'edit';

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      milestoneId: 'none',
      description: '',
      category: '',
      amount: undefined,
      expenseDate: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (!open) return;

    if (isEditMode && initialData) {
      form.reset({
        milestoneId: initialData.milestoneId || 'none',
        description: initialData.description,
        category: initialData.category || '',
        amount: initialData.amount,
        expenseDate: initialData.expenseDate ? initialData.expenseDate.slice(0, 10) : '',
        notes: initialData.notes || '',
      });
      return;
    }

    form.reset({
      milestoneId: 'none',
      description: '',
      category: '',
      amount: undefined,
      expenseDate: '',
      notes: '',
    });
  }, [open, isEditMode, initialData, form]);

  const onSubmit = async (values: ExpenseFormValues) => {
    setIsLoading(true);

    try {
      const payload = {
        milestoneId: values.milestoneId && values.milestoneId !== 'none' ? values.milestoneId : null,
        description: values.description,
        category: values.category || null,
        amount: values.amount,
        expenseDate: values.expenseDate
          ? new Date(`${values.expenseDate}T12:00:00-03:00`).toISOString()
          : null,
        notes: values.notes || null,
      };

      const endpoint = isEditMode && expenseId
        ? `/api/services/projects/${projectId}/expenses/${expenseId}`
        : `/api/services/projects/${projectId}/expenses`;

      const response = await fetch(endpoint, {
        method: isEditMode ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || `No se pudo ${isEditMode ? 'actualizar' : 'registrar'} el gasto`);
        return;
      }

      onOpenChange(false);
      onSaved();
    } catch (error) {
      console.error('Error creating project expense:', error);
      toast.error(`Error al ${isEditMode ? 'actualizar' : 'registrar'} gasto`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{isEditMode ? 'Editar gasto' : 'Registrar gasto'}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {isEditMode
              ? 'Ajusta los datos del gasto y recalcula el costo real del proyecto.'
              : 'Registra costos reales para comparar contra el presupuesto del proyecto.'}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="milestoneId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asignar a hito</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin asignar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {milestones.map((milestone) => (
                        <SelectItem key={milestone.id} value={milestone.id}>
                          {milestone.title}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Compra de materiales eléctricos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <FormControl>
                      <Input placeholder="Materiales" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto (CLP)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? undefined : Number(value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="expenseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha del gasto</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Detalle adicional del gasto"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ResponsiveDialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Registrar gasto'}
              </Button>
            </ResponsiveDialogFooter>
          </form>
        </Form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
