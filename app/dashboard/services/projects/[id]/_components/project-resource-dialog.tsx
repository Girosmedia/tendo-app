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

const resourceFormSchema = z.object({
  milestoneId: z.string().optional(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(180),
  unit: z.string().min(1, 'La unidad es obligatoria').max(40),
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
  consumedQuantity: z.number().nonnegative('No puede ser negativo').optional(),
  unitCost: z.number().nonnegative('El costo unitario no puede ser negativo'),
  notes: z.string().max(5000).optional(),
});

type ResourceFormValues = z.infer<typeof resourceFormSchema>;

interface ProjectResourceDialogProps {
  projectId: string;
  milestones: Array<{ id: string; title: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'create' | 'edit';
  resourceId?: string;
  initialData?: {
    milestoneId: string | null;
    name: string;
    unit: string;
    quantity: number;
    consumedQuantity: number;
    unitCost: number;
    notes: string | null;
  };
  onSaved: () => void;
}

export function ProjectResourceDialog({
  projectId,
  milestones,
  open,
  onOpenChange,
  mode = 'create',
  resourceId,
  initialData,
  onSaved,
}: ProjectResourceDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = mode === 'edit';

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      milestoneId: 'none',
      name: '',
      unit: 'unidad',
      quantity: undefined,
      consumedQuantity: 0,
      unitCost: undefined,
      notes: '',
    },
  });

  useEffect(() => {
    if (!open) return;

    if (isEditMode && initialData) {
      form.reset({
        milestoneId: initialData.milestoneId || 'none',
        name: initialData.name,
        unit: initialData.unit,
        quantity: initialData.quantity,
        consumedQuantity: initialData.consumedQuantity,
        unitCost: initialData.unitCost,
        notes: initialData.notes || '',
      });
      return;
    }

    form.reset({
      milestoneId: 'none',
      name: '',
      unit: 'unidad',
      quantity: undefined,
      consumedQuantity: 0,
      unitCost: undefined,
      notes: '',
    });
  }, [open, isEditMode, initialData, form]);

  const onSubmit = async (values: ResourceFormValues) => {
    setIsLoading(true);

    try {
      const payload = {
        milestoneId: values.milestoneId && values.milestoneId !== 'none' ? values.milestoneId : null,
        name: values.name,
        unit: values.unit,
        quantity: values.quantity,
        consumedQuantity: values.consumedQuantity ?? 0,
        unitCost: values.unitCost,
        notes: values.notes || null,
      };

      const endpoint = isEditMode && resourceId
        ? `/api/services/projects/${projectId}/resources/${resourceId}`
        : `/api/services/projects/${projectId}/resources`;

      const response = await fetch(endpoint, {
        method: isEditMode ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || `No se pudo ${isEditMode ? 'actualizar' : 'registrar'} el recurso`);
        return;
      }

      onOpenChange(false);
      onSaved();
    } catch (error) {
      console.error('Error creating resource:', error);
      toast.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} recurso`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{isEditMode ? 'Editar recurso o material' : 'Agregar recurso o material'}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {isEditMode
              ? 'Actualiza planificación, consumo y costo unitario del recurso.'
              : 'Registra insumos del proyecto para controlar consumo y costo real.'}
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Cemento estructural" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad</FormLabel>
                    <FormControl>
                      <Input placeholder="unidad / kg / m2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo unitario (CLP)</FormLabel>
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
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad planificada</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0.001}
                        step={0.001}
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
                name="consumedQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad consumida</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={0.001}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? undefined : Number(value));
                        }}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Si no has utilizado material aún, deja 0.
                    </p>
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
                    <Textarea rows={3} placeholder="Detalle del recurso" {...field} />
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
                {isLoading ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Agregar recurso'}
              </Button>
            </ResponsiveDialogFooter>
          </form>
        </Form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
