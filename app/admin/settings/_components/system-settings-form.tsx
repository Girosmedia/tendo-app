'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const systemSettingsSchema = z.object({
  trialDays: z.number().int().min(1).max(365),
  founderProgramEnabled: z.boolean(),
  founderTrialDays: z.number().int().min(1).max(365),
  founderDiscountPercent: z.number().int().min(0).max(100),
});

type SystemSettingsFormData = z.infer<typeof systemSettingsSchema>;

interface SystemSettingsFormProps {
  initialSettings: SystemSettingsFormData;
}

export function SystemSettingsForm({ initialSettings }: SystemSettingsFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<SystemSettingsFormData>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      trialDays: initialSettings.trialDays,
      founderProgramEnabled: initialSettings.founderProgramEnabled,
      founderTrialDays: initialSettings.founderTrialDays,
      founderDiscountPercent: initialSettings.founderDiscountPercent,
    },
  });

  const founderProgramEnabled = form.watch('founderProgramEnabled');

  const onSubmit = async (values: SystemSettingsFormData) => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/admin/system-settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'No fue posible actualizar los parámetros');
        return;
      }

      toast.success('Parámetros actualizados correctamente');
      router.refresh();
    } catch (error) {
      console.error('Error actualizando parámetros del sistema:', error);
      toast.error('Error de red al guardar parámetros');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Reglas de Suscripción</h3>
          <p className="text-sm text-muted-foreground">
            Estos parámetros aplican globalmente a nuevos registros y creación manual de tenants.
          </p>
        </div>

        <FormField
          control={form.control}
          name="trialDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Días de Trial estándar</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={field.value}
                  onChange={(event) => field.onChange(Number(event.target.value))}
                />
              </FormControl>
              <FormDescription>
                Duración de trial para nuevos clientes cuando el programa Socio Fundador está apagado.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="founderProgramEnabled"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <FormLabel className="text-base">Programa Socio Fundador</FormLabel>
                <FormDescription>
                  Al activarlo, aplica trial y descuento especial a nuevas suscripciones.
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="founderTrialDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Días de Trial Socio Fundador</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  disabled={!founderProgramEnabled}
                  value={field.value}
                  onChange={(event) => field.onChange(Number(event.target.value))}
                />
              </FormControl>
              <FormDescription>
                Duración de trial extendida para registros durante el programa Socio Fundador.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="founderDiscountPercent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descuento Socio Fundador (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  disabled={!founderProgramEnabled}
                  value={field.value}
                  onChange={(event) => field.onChange(Number(event.target.value))}
                />
              </FormControl>
              <FormDescription>
                Descuento permanente sobre el precio base del plan para nuevas altas con programa activo.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end border-t pt-4">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar parámetros'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
