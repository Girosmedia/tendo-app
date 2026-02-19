'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
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
import { motion } from 'framer-motion';
import { 
  Building2, 
  Briefcase, 
  Users, 
  ArrowRight, 
  ArrowLeft,
  Store,
  Wrench,
  Sparkles,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type WizardStep = 1 | 2 | 3;

const BUSINESS_TYPES = [
  { value: 'RETAIL' as const, label: 'Retail', description: 'Ventas de productos', icon: Store },
  { value: 'SERVICES' as const, label: 'Servicios', description: 'Proyectos y cotizaciones', icon: Wrench },
  { value: 'MIXED' as const, label: 'Mixto', description: 'Productos y servicios', icon: Sparkles },
];

const PLANS = [
  { value: 'BASIC' as const, label: 'Básico', description: 'Perfecto para arrancar', price: 'Gratis' },
  { value: 'PRO' as const, label: 'Pro', description: 'Funcionalidades avanzadas', price: '$15.000/mes' },
];

export function CreateOrgForm() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(1);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [teamInvites, setTeamInvites] = useState<Array<{ email: string; role: 'ADMIN' | 'MEMBER' }>>([]);

  const form = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: '',
      rut: '',
      logoUrl: undefined,
      businessType: undefined,
      plan: 'BASIC',
      teamInvites: [],
    },
  });

  // Formatear RUT mientras se escribe
  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRUT(e.target.value);
    form.setValue('rut', formatted, { shouldValidate: true });
  };

  const addTeamInvite = () => {
    if (teamInvites.length < 2) {
      setTeamInvites([...teamInvites, { email: '', role: 'MEMBER' }]);
    }
  };

  const removeTeamInvite = (index: number) => {
    setTeamInvites(teamInvites.filter((_, i) => i !== index));
  };

  const updateTeamInvite = (index: number, field: 'email' | 'role', value: string) => {
    const updated = [...teamInvites];
    updated[index] = { ...updated[index], [field]: value };
    setTeamInvites(updated);
  };

  const nextStep = async () => {
    const fields = step === 1 ? ['name', 'rut'] : step === 2 ? ['businessType', 'plan'] : [];
    const isValid = await form.trigger(fields as any);
    
    if (isValid && step < 3) {
      setStep((step + 1) as WizardStep);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((step - 1) as WizardStep);
    }
  };

  async function onSubmit(data: CreateOrganizationInput) {
    setIsLoading(true);
    setError('');

    try {
      // Incluir las invitaciones válidas
      const validInvites = teamInvites.filter(inv => inv.email && inv.email.includes('@'));
      
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          teamInvites: validInvites.length > 0 ? validInvites : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Error al crear la organización');
        return;
      }

      // Usar router.push + router.refresh en lugar de hard redirect
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Error al crear organización:', error);
      setError('Ocurrió un error. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl">¡Bienvenido a Tendo!</CardTitle>
        <CardDescription className="text-base">
          {step === 1 && 'Para comenzar, cuéntanos sobre tu negocio'}
          {step === 2 && 'Personaliza tu experiencia'}
          {step === 3 && 'Invita a tu equipo (opcional)'}
        </CardDescription>
        
        {/* Progress Bar */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <motion.div
                className={`h-2 rounded-full ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
                initial={{ width: 0 }}
                animate={{ width: s <= step ? '60px' : '60px' }}
                transition={{ duration: 0.3 }}
              />
              {s < 3 && <div className="mx-1 h-[2px] w-3 bg-muted" />}
            </div>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* PASO 1: Datos de la Empresa */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>Paso 1 de 3</span>
                </div>

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
              </motion.div>
            )}

            {/* PASO 2: Giro y Plan */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span>Paso 2 de 3</span>
                </div>

                <FormField
                  control={form.control}
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>¿Qué tipo de negocio tienes?</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                          {BUSINESS_TYPES.map((type) => {
                            const Icon = type.icon;
                            return (
                              <button
                                key={type.value}
                                type="button"
                                onClick={() => form.setValue('businessType', type.value)}
                                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:border-primary ${
                                  field.value === type.value
                                    ? 'border-primary bg-primary/5'
                                    : 'border-muted'
                                }`}
                              >
                                <Icon className="h-8 w-8 text-primary" />
                                <span className="font-medium">{type.label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {type.description}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selecciona tu plan</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {PLANS.map((plan) => (
                            <button
                              key={plan.value}
                              type="button"
                              onClick={() => form.setValue('plan', plan.value)}
                              className={`flex flex-col gap-2 rounded-lg border-2 p-4 text-left transition-all hover:border-primary ${
                                field.value === plan.value
                                  ? 'border-primary bg-primary/5'
                                  : 'border-muted'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold">{plan.label}</span>
                                {plan.value === 'PRO' && (
                                  <Badge variant="secondary">Popular</Badge>
                                )}
                              </div>
                              <span className="text-2xl font-bold text-primary">
                                {plan.price}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {plan.description}
                              </span>
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
            )}

            {/* PASO 3: Invitar Equipo */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Paso 3 de 3</span>
                </div>

                <div>
                  <FormLabel>Invita a tu equipo</FormLabel>
                  <FormDescription className="mb-4">
                    Puedes invitar hasta 2 personas ahora. Podrás agregar más después.
                  </FormDescription>

                  <div className="space-y-3">
                    {teamInvites.map((invite, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="email@ejemplo.com"
                          value={invite.email}
                          onChange={(e) => updateTeamInvite(index, 'email', e.target.value)}
                          className="flex-1"
                        />
                        <select
                          value={invite.role}
                          onChange={(e) => updateTeamInvite(index, 'role', e.target.value as 'ADMIN' | 'MEMBER')}
                          className="rounded-md border border-input bg-background px-3 py-2"
                        >
                          <option value="MEMBER">Miembro</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeTeamInvite(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    {teamInvites.length < 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addTeamInvite}
                        className="w-full"
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Agregar invitación
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Botones de Navegación */}
            <div className="flex gap-3">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Atrás
                </Button>
              )}
              
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Siguiente
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                  size="lg"
                >
                  {isLoading ? 'Creando organización...' : 'Comenzar con Tendo'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
