'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

const projectFormSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(120),
  description: z.string().max(5000).optional(),
  budget: z.number().nonnegative('El presupuesto no puede ser negativo').optional(),
  startDate: z.string().optional(),
  notes: z.string().max(5000).optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'create' | 'edit';
  projectId?: string;
  initialData?: {
    name: string;
    description: string | null;
    budget: number | null;
    startDate: string;
    notes: string | null;
  };
  onSaved?: () => void;
}

export function ProjectDialog({
  open,
  onOpenChange,
  mode = 'create',
  projectId,
  initialData,
  onSaved,
}: ProjectDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = mode === 'edit';

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      description: '',
      budget: undefined,
      startDate: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (!open) return;

    if (isEditMode && initialData) {
      form.reset({
        name: initialData.name,
        description: initialData.description || '',
        budget: initialData.budget ?? undefined,
        startDate: initialData.startDate ? initialData.startDate.slice(0, 10) : '',
        notes: initialData.notes || '',
      });
      return;
    }

    form.reset({
      name: '',
      description: '',
      budget: undefined,
      startDate: '',
      notes: '',
    });
  }, [open, isEditMode, initialData, form]);

  const onSubmit = async (values: ProjectFormValues) => {
    setIsLoading(true);

    try {
      const payload = {
        name: values.name,
        description: values.description || null,
        budget: values.budget ?? null,
        startDate: values.startDate
          ? new Date(`${values.startDate}T09:00:00-03:00`).toISOString()
          : null,
        notes: values.notes || null,
      };

      const endpoint = isEditMode && projectId
        ? `/api/services/projects/${projectId}`
        : '/api/services/projects';

      const response = await fetch(endpoint, {
        method: isEditMode ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || `No se pudo ${isEditMode ? 'actualizar' : 'crear'} el proyecto`);
        return;
      }

      toast.success(isEditMode ? 'Proyecto actualizado' : 'Proyecto creado exitosamente');
      onOpenChange(false);
      onSaved?.();
      router.refresh();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} proyecto`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{isEditMode ? 'Editar Proyecto' : 'Nuevo Proyecto'}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {isEditMode
              ? 'Actualiza datos base del proyecto para mantener presupuesto y planificación al día.'
              : 'Crea un proyecto para gestionar avance, costos y estado operacional.'}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del proyecto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Remodelación local central" {...field} />
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
                    <Textarea rows={3} placeholder="Descripción general del proyecto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Presupuesto (CLP)</FormLabel>
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
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inicio</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Observaciones internas del proyecto"
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
                {isLoading ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Crear Proyecto'}
              </Button>
            </ResponsiveDialogFooter>
          </form>
        </Form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
