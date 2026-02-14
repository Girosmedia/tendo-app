'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { createOrganizationSchema, type CreateOrganizationInput } from '@/lib/validators/auth';
import { formatRUT } from '@/lib/utils/rut-validator';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function CreateOrgForm() {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: '',
      rut: '',
    },
  });

  // Formatear RUT mientras se escribe
  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRUT(e.target.value);
    form.setValue('rut', formatted, { shouldValidate: true });
  };

  async function onSubmit(data: CreateOrganizationInput) {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Error al crear la organización');
        return;
      }

      // Forzar refresh del JWT haciendo hard redirect
      // Esto permite que el servidor obtenga el nuevo currentOrganizationId
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error al crear organización:', error);
      setError('Ocurrió un error. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl">¡Bienvenido a Tendo!</CardTitle>
        <CardDescription className="text-base">
          Para comenzar, cuéntanos sobre tu negocio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de tu Pyme</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Ferretería El Tornillo"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    El nombre con el que identificarás tu negocio en Tendo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RUT de la Empresa</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: 12.345.678-9"
                      disabled={isLoading}
                      {...field}
                      onChange={(e) => {
                        handleRutChange(e);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    El RUT se formateará automáticamente mientras escribes
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? 'Creando organización...' : 'Comenzar con Tendo'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
