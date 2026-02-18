'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { UserRound, Save, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AVATAR_COLLECTIONS, AVATAR_OPTIONS, AVATAR_OPTION_VALUES } from '@/lib/constants/avatar-options';

const profileSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  jobTitle: z
    .string()
    .max(100, 'El cargo no puede superar 100 caracteres')
    .optional(),
  image: z
    .string()
    .url('Avatar inválido')
    .refine((value) => AVATAR_OPTION_VALUES.includes(value), {
      message: 'Debes seleccionar un avatar disponible',
    }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialData: {
    name: string;
    jobTitle: string;
    email: string;
    image: string;
  };
}

function getInitials(name: string) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData.name,
      jobTitle: initialData.jobTitle,
      image: initialData.image || AVATAR_OPTIONS[0].value,
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const body = await response.json();

      if (!response.ok) {
        toast.error(body.error || 'No se pudo actualizar el perfil');
        return;
      }

      toast.success('Perfil actualizado correctamente');
      router.refresh();
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      toast.error('Error al actualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserRound className="h-5 w-5 text-primary" />
          <CardTitle>Datos de Usuario</CardTitle>
        </div>
        <CardDescription>
          Esta información corresponde a tu cuenta personal, no a la organización
        </CardDescription>
      </CardHeader>
      <CardContent className="min-w-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 min-w-0">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu nombre" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Encargado de Ventas" {...field} value={field.value ?? ''} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>

            <FormItem>
              <FormLabel>Email (no editable)</FormLabel>
              <FormControl>
                <Input type="email" value={initialData.email} disabled />
              </FormControl>
            </FormItem>

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <div className="flex flex-col items-start gap-3 rounded-lg border p-3 sm:flex-row sm:items-center">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={field.value} alt="Avatar seleccionado" />
                          <AvatarFallback>{getInitials(form.watch('name'))}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm text-muted-foreground">Avatar actual</p>
                          <p className="text-sm font-medium">
                            {AVATAR_OPTIONS.find((option) => option.value === field.value)?.label ?? 'Sin selección'}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-lg border p-2">
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-10 w-full justify-between px-2"
                          onClick={() => setIsAvatarPickerOpen((open) => !open)}
                          disabled={isLoading}
                        >
                          <span>Seleccionar avatar</span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isAvatarPickerOpen ? 'rotate-180' : ''}`} />
                        </Button>

                        {isAvatarPickerOpen ? (
                          <div className="space-y-4 px-1 pb-1 pt-3">
                            {Object.entries(AVATAR_COLLECTIONS).map(([collectionName, options]) => (
                              <div key={collectionName} className="space-y-2">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  {collectionName}
                                </p>
                                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                                  {options.map((option) => (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={() => field.onChange(option.value)}
                                      disabled={isLoading}
                                      className={`flex w-full items-center justify-center rounded-lg border p-2 transition ${field.value === option.value ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/40'}`}
                                      aria-label={`Seleccionar avatar ${option.label}`}
                                      title={option.label}
                                    >
                                      <Avatar className="h-10 w-10">
                                        <AvatarImage src={option.value} alt={option.label} />
                                        <AvatarFallback>{option.label.slice(0, 2)}</AvatarFallback>
                                      </Avatar>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="text-xs text-muted-foreground">El RUT no pertenece a tu cuenta de usuario; se administra a nivel de organización.</p>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? 'Guardando...' : 'Guardar perfil'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
