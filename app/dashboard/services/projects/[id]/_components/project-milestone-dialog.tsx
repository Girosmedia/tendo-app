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

const milestoneFormSchema = z.object({
  title: z.string().min(2, 'El título debe tener al menos 2 caracteres').max(140),
  description: z.string().max(5000).optional(),
  dueDate: z.string().optional(),
  estimatedCost: z.number().nonnegative('El costo estimado no puede ser negativo').optional(),
});

type MilestoneFormValues = z.infer<typeof milestoneFormSchema>;

interface ProjectMilestoneDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'create' | 'edit';
  milestoneId?: string;
  initialData?: {
    title: string;
    description: string | null;
    dueDate: string | null;
    estimatedCost: number | null;
  };
  onSaved: () => void;
}

export function ProjectMilestoneDialog({
  projectId,
  open,
  onOpenChange,
  mode = 'create',
  milestoneId,
  initialData,
  onSaved,
}: ProjectMilestoneDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = mode === 'edit';

  const form = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneFormSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: '',
      estimatedCost: undefined,
    },
  });

  useEffect(() => {
    if (!open) return;

    if (isEditMode && initialData) {
      form.reset({
        title: initialData.title,
        description: initialData.description || '',
        dueDate: initialData.dueDate ? initialData.dueDate.slice(0, 10) : '',
        estimatedCost: initialData.estimatedCost ?? undefined,
      });
      return;
    }

    form.reset({
      title: '',
      description: '',
      dueDate: '',
      estimatedCost: undefined,
    });
  }, [open, isEditMode, initialData, form]);

  const onSubmit = async (values: MilestoneFormValues) => {
    setIsLoading(true);

    try {
      const payload = {
        title: values.title,
        description: values.description || null,
        dueDate: values.dueDate
          ? new Date(`${values.dueDate}T12:00:00-03:00`).toISOString()
          : null,
        estimatedCost: values.estimatedCost ?? null,
      };

      const endpoint = isEditMode && milestoneId
        ? `/api/services/projects/${projectId}/milestones/${milestoneId}`
        : `/api/services/projects/${projectId}/milestones`;

      const response = await fetch(endpoint, {
        method: isEditMode ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || `No se pudo ${isEditMode ? 'actualizar' : 'crear'} el hito`);
        return;
      }

      onOpenChange(false);
      onSaved();
    } catch (error) {
      console.error('Error creating milestone:', error);
      toast.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} hito`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{isEditMode ? 'Editar hito' : 'Nuevo hito'}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {isEditMode
              ? 'Actualiza la planificación del hito y su costo estimado.'
              : 'Define una etapa concreta del proyecto para medir avance.'}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Compra de materiales" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha objetivo</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimatedCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Costo estimado (CLP)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Detalle del hito" {...field} />
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
                {isLoading ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Crear hito'}
              </Button>
            </ResponsiveDialogFooter>
          </form>
        </Form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
