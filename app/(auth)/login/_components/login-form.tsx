'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Sparkles } from 'lucide-react';
import { loginSchema, type LoginInput } from '@/lib/validators/auth';
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginInput) {
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email o contraseña incorrectos');
        return;
      }

      // Redirigir al onboarding o dashboard
      router.push('/onboarding');
      router.refresh();
    } catch (err) {
      console.error('Error en login:', err);
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
            Vuelve a
            <span className="bg-gradient-to-r from-brand-primary to-brand-success bg-clip-text text-transparent dark:from-white dark:to-brand-success"> vender mejor</span>
          </h1>
          <p className="max-w-md text-base text-muted-foreground">
            Controla ventas, caja, clientes y operaciones diarias desde un solo lugar.
          </p>
        </div>

        <div className="rounded-2xl border bg-card/80 p-5 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Si tu organización ya está creada, al iniciar sesión entrarás directo a tu dashboard.
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
              <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
              <CardDescription>Ingresa tus credenciales para acceder a Tendo</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                  <div className="flex items-center justify-between">
                    <FormLabel>Contraseña</FormLabel>
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
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
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
        </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t bg-muted/20 py-4">
          <p className="text-sm text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
