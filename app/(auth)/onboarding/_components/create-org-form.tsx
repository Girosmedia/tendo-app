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
import { AnimatePresence, motion } from 'framer-motion';
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
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { type SubscriptionSystemConfig } from '@/lib/system-settings';

type WizardStep = 1 | 2 | 3;

const BUSINESS_TYPES = [
  { value: 'RETAIL' as const, label: 'Retail', description: 'Ventas de productos', icon: Store },
  { value: 'SERVICES' as const, label: 'Servicios', description: 'Proyectos y cotizaciones', icon: Wrench },
  { value: 'MIXED' as const, label: 'Mixto', description: 'Productos y servicios', icon: Sparkles },
];

const BASE_PLANS = [
  { value: 'BASIC' as const, label: 'Basic', description: 'Un track: Retail o Servicios', basePrice: 19990 },
  { value: 'PRO' as const, label: 'Pro', description: 'Incluye track Mixto y funciones avanzadas', basePrice: 29990 },
];

interface CreateOrgFormProps {
  systemConfig: SubscriptionSystemConfig;
}

export function CreateOrgForm({ systemConfig }: CreateOrgFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(1);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [teamInvites, setTeamInvites] = useState<Array<{ email: string; role: 'ADMIN' | 'MEMBER' }>>([]);

  // Helper para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

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

  const selectedPlan = form.watch('plan');

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
    const fields: Array<'name' | 'rut' | 'businessType' | 'plan'> =
      step === 1 ? ['name', 'rut'] : step === 2 ? ['businessType', 'plan'] : [];
    const isValid = await form.trigger(fields);
    
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
    // Evitar envío accidental si no estamos en el último paso
    if (step !== 3) {
      await nextStep();
      return;
    }

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
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-2">
      {/* COLUMNA IZQUIERDA - Información y Branding */}
      <div className="hidden flex-col justify-center space-y-6 lg:flex">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Logo */}
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

          {/* Título dinámico según paso */}
          <div className="space-y-3">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-5xl font-bold leading-[1.05] tracking-tight text-foreground">
                    Bienvenido a tu<br />
                    <span className="bg-gradient-to-r from-brand-primary to-brand-success bg-clip-text text-transparent dark:from-white dark:to-brand-success">
                      nueva gestión
                    </span>
                  </h2>
                  <p className="mt-3 text-lg text-muted-foreground">
                    Configura tu negocio en menos de 2 minutos y comienza a vender más inteligente.
                  </p>
                </motion.div>
              )}
              
              {step === 2 && (
                <motion.div
                  key="plan"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-5xl font-bold leading-[1.05] tracking-tight text-foreground">
                    Elige tu plan<br />
                    <span className="bg-gradient-to-r from-brand-primary to-brand-success bg-clip-text text-transparent dark:from-white dark:to-brand-success">
                      perfecto
                    </span>
                  </h2>
                  <p className="mt-3 text-lg text-muted-foreground">
                    Sin compromisos ni letras chicas. Cancela cuando quieras.
                  </p>
                </motion.div>
              )}
              
              {step === 3 && (
                <motion.div
                  key="team"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-5xl font-bold leading-[1.05] tracking-tight text-foreground">
                    Construye tu<br />
                    <span className="bg-gradient-to-r from-brand-primary to-brand-success bg-clip-text text-transparent dark:from-white dark:to-brand-success">
                      equipo
                    </span>
                  </h2>
                  <p className="mt-3 text-lg text-muted-foreground">
                    Invita a tu equipo ahora o hazlo más tarde desde el panel.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Banner Socios Fundadores - Solo en paso 2 */}
          {step === 2 && systemConfig.founderProgramEnabled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="relative overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-6 shadow-xl dark:border-amber-700 dark:from-amber-950/50 dark:via-orange-950/50 dark:to-yellow-950/50"
            >
              {/* Badge flotante */}
              <div className="absolute -right-10 -top-10 h-32 w-32 rotate-12 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-400/20 blur-2xl" />
              
              <div className="relative space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-amber-900 dark:text-amber-100">Socio Fundador</h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300">Oferta por tiempo limitado</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-bold text-foreground">60 días gratis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-bold text-foreground">50% descuento de por vida</span>
                  </div>
                </div>

                <div className="rounded-lg bg-white/60 p-3 dark:bg-primary/20">
                  <p className="text-xs font-medium leading-relaxed text-muted-foreground">
                    Los precios ya reflejan tu beneficio exclusivo.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Ilustración SVG */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex justify-center"
          >
            <svg viewBox="0 0 400 300" className="h-auto w-full max-w-sm opacity-40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="200" cy="150" r="100" className="fill-primary/10" />
              <circle cx="200" cy="150" r="60" className="fill-primary/20" />
              <rect x="140" y="100" width="120" height="100" rx="8" className="fill-card stroke-border" strokeWidth="2" />
              <path d="M150 115h100M150 130h80M150 145h90" className="stroke-muted-foreground/30" strokeWidth="3" strokeLinecap="round" />
              <circle cx="220" cy="180" r="20" className="fill-primary">
                <animate attributeName="r" values="20;22;20" dur="2s" repeatCount="indefinite" />
              </circle>
              <path d="M215 180l4 4 8-8" className="stroke-primary-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        </motion.div>
      </div>

      {/* COLUMNA DERECHA - Formulario */}
      <div className="flex h-full min-h-0 flex-col">
        <Card className="flex h-full min-h-0 max-h-[95dvh] flex-col shadow-2xl lg:max-h-[85vh]">
          <CardHeader className="shrink-0">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Logo mobile */}
              <div className="mb-6 flex items-center justify-center lg:hidden">
                <img
                  src="/tendo_sin_fondo/logo.svg"
                  alt="Tendo"
                  className="h-9 w-auto dark:hidden"
                />
                <img
                  src="/tendo_sin_fondo/logo_negativo.svg"
                  alt="Tendo"
                  className="hidden h-9 w-auto dark:block"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Paso {step} de 3
                  </p>
                  <h3 className="mt-1 text-lg font-bold tracking-tight text-foreground lg:hidden">
                    {step === 1 && 'Datos de tu Negocio'}
                    {step === 2 && 'Selecciona tu Plan'}
                    {step === 3 && 'Invita a tu Equipo'}
                  </h3>
                </div>
                
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3].map((s) => (
                    <motion.div
                      key={s}
                      className={`h-1.5 rounded-full transition-all ${
                        s <= step ? 'bg-primary' : 'bg-muted'
                      }`}
                      initial={{ width: 8 }}
                      animate={{ width: s === step ? 24 : 8 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </CardHeader>
          
          <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 h-full flex-col">
                {/* Área scrolleable */}
                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-6 pt-4">
                  <AnimatePresence mode="wait">
              {/* PASO 1: Datos de la Empresa */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 space-y-6"
                >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de tu Negocio</FormLabel>
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
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 space-y-6"
                >
                <FormField
                  control={form.control}
                  name="plan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Selecciona tu suscripción</FormLabel>
                      {systemConfig.founderProgramEnabled && (
                        <>
                          {/* Banner móvil compacto */}
                          <div className="mt-3 flex items-center gap-2 rounded-lg border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-3 lg:hidden dark:border-amber-700 dark:from-amber-950/50 dark:to-orange-950/50">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500">
                              <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-amber-900 dark:text-amber-100">
                                Socio Fundador: 60 días gratis + 50% OFF vitalicio
                              </p>
                            </div>
                          </div>
                          
                          <p className="mt-2 text-xs text-muted-foreground">
                            Los precios ya incluyen tu descuento exclusivo
                          </p>
                        </>
                      )}
                      
                      <FormControl>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {BASE_PLANS.map((plan) => {
                            const isFounder = systemConfig.founderProgramEnabled;
                            const discount = isFounder ? systemConfig.founderDiscountPercent : 0;
                            const finalPrice = Math.round(plan.basePrice * (1 - discount / 100));

                            return (
                              <button
                                key={plan.value}
                                type="button"
                                onClick={() => {
                                  form.setValue('plan', plan.value, { shouldValidate: true });

                                  if (plan.value === 'PRO') {
                                    form.setValue('businessType', 'MIXED', { shouldValidate: true });
                                  }

                                  if (plan.value === 'BASIC' && form.getValues('businessType') === 'MIXED') {
                                    form.setValue('businessType', 'RETAIL', { shouldValidate: true });
                                  }
                                }}
                                className={`group relative flex flex-col gap-3 rounded-xl border-2 p-5 text-left transition-all hover:border-primary hover:shadow-md ${
                                  field.value === plan.value
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                    : 'border-muted bg-card hover:bg-muted/50'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-foreground">{plan.label}</span>
                                  {plan.value === 'PRO' && (
                                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">Popular</Badge>
                                  )}
                                </div>
                                
                                <div className="flex flex-col">
                                   {isFounder ? (
                                     <div className="space-y-1">
                                       <span className="text-sm font-medium text-muted-foreground line-through decoration-destructive/50">
                                         {formatCurrency(plan.basePrice)}/mes
                                       </span>
                                       <div className="flex items-baseline gap-1">
                                         <span className="text-3xl font-extrabold text-primary">
                                           {formatCurrency(finalPrice)}
                                         </span>
                                         <span className="text-sm font-medium text-muted-foreground">/mes</span>
                                       </div>
                                       <span className="inline-flex items-center text-xs font-bold text-amber-600 dark:text-amber-400">
                                         <Sparkles className="mr-1 h-3 w-3" />
                                         Socio Fundador (-{discount}%)
                                       </span>
                                     </div>
                                   ) : (
                                     <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-extrabold text-primary">
                                          {formatCurrency(plan.basePrice)}
                                        </span>
                                        <span className="text-sm font-medium text-muted-foreground">/mes</span>
                                     </div>
                                   )}
                                </div>

                                <span className="text-sm leading-snug text-muted-foreground">
                                  {plan.description}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Basic permite un solo track. Pro habilita Mixto por defecto.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ahora, define tu track operativo</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                          {BUSINESS_TYPES.map((type) => {
                            const Icon = type.icon;
                            const isMixedBlocked = selectedPlan === 'BASIC' && type.value === 'MIXED';

                            return (
                              <button
                                key={type.value}
                                type="button"
                                onClick={() => {
                                  if (isMixedBlocked) {
                                    return;
                                  }

                                  form.setValue('businessType', type.value, { shouldValidate: true });
                                }}
                                disabled={isMixedBlocked}
                                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                                  isMixedBlocked ? 'cursor-not-allowed border-muted bg-muted/30 opacity-60' : 'hover:border-primary'
                                } ${
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
                                {isMixedBlocked && (
                                  <span className="text-xs font-medium text-muted-foreground">
                                    Disponible en plan Pro
                                  </span>
                                )}
                              </button>
                            );
                          })}
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
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 space-y-6"
                >
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
                  </AnimatePresence>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center text-sm font-medium text-destructive"
                    >
                      {error}
                    </motion.div>
                  )}
                </div>

                {/* Botones de Navegación - Fijos al fondo */}
                <div className="shrink-0 border-t bg-card px-6 py-4">
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
                  key="next-btn"
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
                  key="submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                  size="lg"
                >
                  {isLoading ? 'Creando organización...' : 'Comenzar con Tendo'}
                </Button>
              )}
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
