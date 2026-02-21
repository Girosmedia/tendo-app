'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Building2, MapPin, Phone, FileText, Save, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { validateRUT, formatRUT } from '@/lib/rut-validator';

const settingsSchema = z.object({
  // Identidad
  businessName: z.string().min(1, 'El nombre comercial es requerido'),
  tradeName: z.string().optional(),
  rut: z.string().refine((val) => validateRUT(val), {
    message: 'RUT inválido',
  }),
  logoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  logoDarkUrl: z.string().url('URL inválida').optional().or(z.literal('')),

  // Ubicación
  address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().min(1),

  // Contacto
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  website: z.string().url('URL inválida').optional().or(z.literal('')),

  // Fiscal
  taxRegime: z.string().optional(),
  economicActivity: z.string().optional(),

  // Regional
  timezone: z.string().min(1),
  currency: z.string().min(1),
  locale: z.string().min(1),

  // Comisiones tarjeta
  cardDebitCommissionRate: z.number().min(0).max(100),
  cardCreditCommissionRate: z.number().min(0).max(100),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  initialData?: Partial<SettingsFormValues>;
}

// Regiones de Chile
const REGIONES_CHILE = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana de Santiago',
  "O'Higgins",
  'Maule',
  'Ñuble',
  'Biobío',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén',
  'Magallanes',
];

const TAX_REGIMES = [
  'Régimen General (1era Categoría)',
  'Régimen Simplificado (14 ter)',
  'Régimen Pro-Pyme',
  'Régimen de Renta Presunta',
];

export function SettingsForm({ initialData }: SettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      businessName: initialData?.businessName ?? '',
      tradeName: initialData?.tradeName ?? undefined,
      rut: initialData?.rut ?? '',
      logoUrl: initialData?.logoUrl ?? undefined,
      logoDarkUrl: initialData?.logoDarkUrl ?? undefined,
      address: initialData?.address ?? undefined,
      city: initialData?.city ?? undefined,
      region: initialData?.region ?? undefined,
      country: initialData?.country ?? 'Chile',
      phone: initialData?.phone ?? undefined,
      email: initialData?.email ?? undefined,
      website: initialData?.website ?? undefined,
      taxRegime: initialData?.taxRegime ?? undefined,
      economicActivity: initialData?.economicActivity ?? undefined,
      timezone: initialData?.timezone ?? 'America/Santiago',
      currency: initialData?.currency ?? 'CLP',
      locale: initialData?.locale ?? 'es-CL',
      cardDebitCommissionRate: initialData?.cardDebitCommissionRate ?? 0,
      cardCreditCommissionRate: initialData?.cardCreditCommissionRate ?? 0,
    },
  });

  const onSubmit = async (data: SettingsFormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Configuración guardada exitosamente');
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setIsLoading(false);
    }
  };

  // Formatear RUT al salir del campo
  const handleRUTBlur = () => {
    const currentRUT = form.getValues('rut');
    if (currentRUT && validateRUT(currentRUT)) {
      form.setValue('rut', formatRUT(currentRUT));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Información General */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Información General</CardTitle>
            </div>
            <CardDescription>
              Datos básicos de tu empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razón Social *</FormLabel>
                    <FormControl>
                      <Input placeholder="Mi Empresa SpA" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nombre legal de la empresa
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tradeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de Fantasía</FormLabel>
                    <FormControl>
                      <Input placeholder="Mi Negocio" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nombre comercial (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="rut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RUT *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="12.345.678-9"
                        {...field}
                        onBlur={handleRUTBlur}
                      />
                    </FormControl>
                    <FormDescription>
                      RUT de la empresa
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Logo modo claro
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">☀︎ Light</span>
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <Input
                            type="url"
                            placeholder="https://mi-empresa.com/logo.png"
                            {...field}
                          />
                          {field.value && (
                            <div className="flex h-10 w-20 shrink-0 items-center justify-center rounded-md border bg-white p-1">
                              <img src={field.value} alt="Preview" className="h-8 w-auto max-w-18 object-contain" />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Logo sobre fondos claros (se muestra en modo claro)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logoDarkUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Logo modo oscuro
                        <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-200">🌙 Dark</span>
                        <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <Input
                            type="url"
                            placeholder="https://mi-empresa.com/logo-blanco.png"
                            {...field}
                          />
                          {field.value && (
                            <div className="flex h-10 w-20 shrink-0 items-center justify-center rounded-md border bg-slate-900 p-1">
                              <img src={field.value} alt="Preview dark" className="h-8 w-auto max-w-18 object-contain" />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Versión del logo para fondos oscuros (blanco/negativo). Si no lo subes, se usará el logo claro sobre fondo blanco.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ubicación */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle>Ubicación</CardTitle>
            </div>
            <CardDescription>
              Dirección y datos geográficos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input placeholder="Av. Principal 123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad</FormLabel>
                    <FormControl>
                      <Input placeholder="Santiago" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Región</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar región" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REGIONES_CHILE.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
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
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <FormControl>
                      <Input placeholder="Chile" {...field} readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contacto */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <CardTitle>Contacto</CardTitle>
            </div>
            <CardDescription>
              Medios de contacto de la empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+56 9 1234 5678"
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
                        placeholder="contacto@empresa.cl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sitio Web</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://empresa.cl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Información Fiscal */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Información Fiscal</CardTitle>
            </div>
            <CardDescription>
              Datos tributarios y régimen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="taxRegime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Régimen Tributario</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar régimen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TAX_REGIMES.map((regime) => (
                          <SelectItem key={regime} value={regime}>
                            {regime}
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
                name="economicActivity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actividad Económica</FormLabel>
                    <FormControl>
                      <Input placeholder="Comercio al por menor" {...field} />
                    </FormControl>
                    <FormDescription>
                      Giro o rubro principal
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Comisiones de Tarjeta */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle>Comisiones de Tarjeta</CardTitle>
            </div>
            <CardDescription>
              Configura proveedor y tasas para débito/crédito por canal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ['cardDebitCommissionRate', 'Comisión débito (%)'],
                ['cardCreditCommissionRate', 'Comisión crédito (%)'],
              ].map(([name, label]) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name as keyof SettingsFormValues}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          value={typeof field.value === 'number' ? field.value : 0}
                          onChange={(e) => {
                            const raw = e.target.value;
                            field.onChange(raw === '' ? 0 : Number(raw));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
