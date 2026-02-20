'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, Sparkles } from 'lucide-react';
import { registerSchema, type RegisterInput } from '@/lib/validators/auth';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const invitationToken = searchParams.get('invitationToken') || undefined;

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: RegisterInput) {
    setIsLoading(true);
    setError('');

    try {
      // 1. Registrar el usuario
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          invitationToken,
        }),
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        // Mostrar detalles de validación si están disponibles
        if (registerData.details) {
          const errors = Object.values(registerData.details).flat();
          setError(errors.join(', ') || 'Error de validación');
        } else {
          setError(registerData.error || 'Error al registrar usuario');
        }
        return;
      }

      // 2. Login automático después del registro
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Usuario creado pero no se pudo iniciar sesión automáticamente');
        router.push('/login');
        return;
      }

      // 3. Redirigir según contexto
      router.push(invitationToken ? '/dashboard' : '/onboarding');
      router.refresh();
    } catch (err) {
      console.error('Error en registro:', err);
      setError('Ocurrió un error. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid w-full grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
      <div className="hidden flex-col justify-center space-y-6 px-4 lg:flex">
        <div className="space-y-5">
          <div className="flex h-12 items-center">
            <img
              src="/tendo_sin_fondo/logo.svg"
              alt="Tendo"
              className="h-10 w-auto dark:hidden sm:h-11"
            />
            <img
              src="/tendo_sin_fondo/logo_negativo.svg"
              alt="Tendo"
              className="hidden h-10 w-auto dark:block sm:h-11"
            />
          </div>
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-foreground">
            Empieza a
            <span className="bg-gradient-to-r from-brand-primary to-brand-success bg-clip-text text-transparent dark:from-white dark:to-brand-success"> digitalizar tu negocio</span>
          </h1>
          <p className="max-w-md text-base text-muted-foreground">
            Crea tu cuenta y en minutos tendrás ventas, clientes y operaciones bajo control.
          </p>
        </div>

        <div className="rounded-2xl border bg-card/80 p-5 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Después del registro te guiaremos por onboarding para configurar tu organización.
            </p>
          </div>
        </div>
      </div>

      <Card className="mx-auto w-full max-w-lg border-border/60 bg-card/95 shadow-2xl backdrop-blur-sm">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center lg:hidden">
            <img src="/tendo_sin_fondo/logo.svg" alt="Tendo" className="h-9 w-auto dark:hidden" />
            <img src="/tendo_sin_fondo/logo_negativo.svg" alt="Tendo" className="hidden h-9 w-auto dark:block" />
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-primary/5 p-3">
            <div className="rounded-md bg-primary/10 p-2">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
              <CardDescription>
                {invitationToken
                  ? 'Completa tus datos para unirte a tu organización en Tendo'
                  : 'Registra tu cuenta para comenzar a usar Tendo'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Juan Pérez"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="tu@email.com"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="h-11 w-full" disabled={isLoading}>
              {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>
          </form>
        </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t bg-muted/20 py-4">
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Inicia sesión aquí
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
