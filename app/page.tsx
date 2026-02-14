'use client'

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Store, 
  Wrench, 
  DollarSign, 
  Users, 
  BarChart3, 
  Zap,
  Check,
  Sparkles,
  CreditCard,
  TrendingUp,
  Package,
  Receipt,
  AlertCircle,
  Ban,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { BorderBeam } from '@/components/ui/border-beam';
import { AmbientGradient } from '@/components/ui/ambient-gradient';

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any }
};

const staggerContainer = {
  initial: {},
  whileInView: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Ambient Gradient Background */}
      <AmbientGradient />

      {/* Header with Glassmorphism */}
      <header className="sticky top-0 z-50 border-b border-border/40 backdrop-blur-xl bg-background/60 supports-[backdrop-filter]:bg-background/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25">
                T
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Tendo</span>
            </motion.div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Funcionalidades
              </a>
              <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Precios
              </a>
              <Link href="/login">
                <Button variant="ghost" size="sm">Iniciar Sesión</Button>
              </Link>
              <Link href="/register">
                <ShimmerButton size="sm">
                  Comenzar Gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </ShimmerButton>
              </Link>
            </nav>
            <Link href="/register" className="md:hidden">
              <Button size="sm">Empezar</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Split Layout 60/40 */}
      <section className="relative py-20 sm:py-32 lg:py-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[60%_40%] gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <motion.div 
              className="max-w-3xl"
              initial="initial"
              animate="whileInView"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp}>
                <Badge variant="secondary" className="mb-6 text-xs sm:text-sm backdrop-blur-sm bg-primary/10 border-primary/20">
                  <Sparkles className="mr-2 h-3 w-3" />
                  El Sistema Operativo para tu Negocio
                </Badge>
              </motion.div>
              
              <motion.h1 
                className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-6"
                variants={fadeInUp}
              >
                <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                  Gestiona tu Pyme
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary via-primary to-success bg-clip-text text-transparent animate-pulse">
                  sin complicaciones
                </span>
              </motion.h1>
              
              <motion.p 
                className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed"
                variants={fadeInUp}
              >
                Tendo es el primer sistema de gestión diseñado para{' '}
                <strong className="text-foreground font-semibold">pequeños negocios chilenos</strong>.
                Simple, poderoso y adaptado a cómo trabajas.
              </motion.p>

              <motion.div 
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-12"
                variants={fadeInUp}
              >
                <Link href="/register">
                  <ShimmerButton size="lg" className="w-full sm:w-auto text-base h-14 px-8 shadow-xl shadow-primary/25">
                    Pruébalo Gratis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </ShimmerButton>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-base h-14 px-8 backdrop-blur-sm">
                    Ver Demo
                  </Button>
                </Link>
              </motion.div>

              <motion.p 
                className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-2"
                variants={fadeInUp}
              >
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-success" />
                  Sin tarjeta de crédito
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-success" />
                  Configuración en 2 minutos
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-success" />
                  Soporte en español
                </span>
              </motion.p>
            </motion.div>

            {/* Right: Floating App Preview */}
            <motion.div
              className="relative hidden lg:block"
              initial={{ opacity: 0, x: 40, rotateY: -15 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative">
                {/* Main Preview Card with Glassmorphism */}
                <motion.div 
                  className="relative rounded-[2rem] border border-border/50 bg-card/40 backdrop-blur-2xl p-8 shadow-2xl"
                  animate={{ 
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <div className="space-y-6">
                    {/* POS Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">$ 15.750</div>
                        <div className="text-sm text-muted-foreground">Total de Venta</div>
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Store className="h-6 w-6 text-primary" />
                      </div>
                    </div>

                    {/* Products */}
                    <div className="space-y-3">
                      {[
                        { name: 'Producto A', price: '$ 5.250', qty: 2 },
                        { name: 'Servicio B', price: '$ 10.500', qty: 1 },
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-xl bg-background/60 backdrop-blur-sm border border-border/30"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + i * 0.1 }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-success/20" />
                            <div>
                              <div className="font-medium text-sm">{item.name}</div>
                              <div className="text-xs text-muted-foreground">Cant: {item.qty}</div>
                            </div>
                          </div>
                          <div className="font-semibold">{item.price}</div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="h-10 rounded-lg bg-success/20 border border-success/30 flex items-center justify-center text-sm font-medium text-success">
                        <Check className="h-4 w-4 mr-2" />
                        Cobrar
                      </div>
                      <div className="h-10 rounded-lg bg-border/50 flex items-center justify-center text-sm font-medium">
                        Cancelar
                      </div>
                    </div>
                  </div>

                  {/* Floating Elements */}
                  <motion.div
                    className="absolute -top-4 -right-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-success to-success/80 shadow-lg shadow-success/50 flex items-center justify-center text-success-foreground"
                    animate={{ 
                      y: [0, -8, 0],
                      rotate: [0, 5, 0]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5
                    }}
                  >
                    <TrendingUp className="h-8 w-8" />
                  </motion.div>

                  <motion.div
                    className="absolute -bottom-6 -left-6 h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/50 flex items-center justify-center text-primary-foreground"
                    animate={{ 
                      y: [0, 8, 0],
                      rotate: [0, -5, 0]
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1
                    }}
                  >
                    <Receipt className="h-10 w-10" />
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Badge */}
      <motion.section 
        className="relative py-12 border-y border-border/40 backdrop-blur-sm bg-muted/10"
        {...fadeInUp}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '100%', label: 'Diseñado para Chile' },
              { value: '2 min', label: 'Para comenzar' },
              { value: 'Gratis', label: 'Plan inicial' },
              { value: '24/7', label: 'Acceso en la nube' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-primary to-success bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Problem Section - Premium Redesign */}
      <motion.section className="relative py-20 sm:py-32" {...fadeInUp}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <motion.h2 
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-6"
              {...fadeInUp}
            >
              ¿Cansado de sistemas complicados?
            </motion.h2>
            <motion.p 
              className="text-lg text-muted-foreground text-center mb-16"
              {...fadeInUp}
            >
              Los software tradicionales están diseñados para grandes empresas.
              Son caros, difíciles de usar y no hablan tu idioma.
            </motion.p>
            
            <motion.div 
              className="grid sm:grid-cols-3 gap-6 lg:gap-8"
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true }}
            >
              {[
                { 
                  Icon: AlertCircle, 
                  title: 'Complicados', 
                  desc: 'Necesitas capacitación para usar funciones básicas',
                  gradient: 'from-orange-500/10 to-destructive/10'
                },
                { 
                  Icon: DollarSign, 
                  title: 'Caros', 
                  desc: 'Pagas por funciones que nunca usarás',
                  gradient: 'from-destructive/10 to-red-500/10'
                },
                { 
                  Icon: Ban, 
                  title: 'Genéricos', 
                  desc: 'No se adaptan a tu tipo de negocio',
                  gradient: 'from-red-500/10 to-orange-500/10'
                },
              ].map((problem, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className="group relative p-8 rounded-3xl border border-destructive/20 bg-gradient-to-br from-card via-card to-destructive/5 backdrop-blur-xl hover:border-destructive/40 hover:shadow-2xl hover:shadow-destructive/10 transition-all duration-500 overflow-hidden"
                >
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${problem.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  {/* Large X background decoration */}
                  <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500">
                    <XCircle className="h-32 w-32 text-destructive" strokeWidth={1} />
                  </div>
                  
                  <div className="relative z-10">
                    {/* Icon with gradient background */}
                    <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-destructive/20 to-destructive/10 text-destructive group-hover:from-destructive/30 group-hover:to-destructive/20 group-hover:scale-110 transition-all duration-300 shadow-lg shadow-destructive/10">
                      <problem.Icon className="h-7 w-7" strokeWidth={2} />
                    </div>
                    
                    <h3 className="text-xl font-bold mb-3 text-destructive group-hover:text-destructive/90 transition-colors">
                      {problem.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {problem.desc}
                    </p>
                  </div>

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-destructive/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Bento Grid Features Section */}
      <section id="features" className="relative py-20 sm:py-32 bg-muted/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="mx-auto max-w-3xl text-center mb-16"
            {...fadeInUp}
          >
            <Badge variant="outline" className="mb-4 backdrop-blur-sm">
              La Solución
            </Badge>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Un sistema que <span className="bg-gradient-to-r from-primary via-primary to-success bg-clip-text text-transparent">crece</span> contigo
            </h2>
            <p className="text-lg text-muted-foreground">
              Tendo se adapta a tu negocio. Activa solo los módulos que necesitas hoy,
              y expande cuando estés listo.
            </p>
          </motion.div>

          {/* Bento Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true, margin: '-50px' }}
          >
            {/* POS - Large Card (2 columns on lg) */}
            <motion.div 
              variants={fadeInUp}
              className="group relative lg:col-span-2 p-8 rounded-3xl border border-border/50 bg-gradient-to-br from-card via-card to-primary/5 backdrop-blur-xl hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 overflow-hidden"
            >
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform duration-300">
                  <Store className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Punto de Venta</h3>
                <p className="text-muted-foreground mb-6 max-w-lg">
                  Vende rápido con lector de códigos, control de stock y cierre de caja automático.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    'Interface ultra-rápida',
                    'Control de inventario en tiempo real',
                    'Cierre de caja automático',
                    'Lector de códigos de barra'
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating mockup elements */}
              <motion.div
                className="absolute -right-8 -bottom-8 h-32 w-32 rounded-2xl bg-gradient-to-br from-success/30 to-primary/30 backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                animate={{ rotate: [0, 5, 0] }}
                transition={{ duration: 6, repeat: Infinity }}
              />
            </motion.div>

            {/* Servicios */}
            <motion.div 
              variants={fadeInUp}
              className="group relative p-8 rounded-3xl border border-border/50 bg-card/80 backdrop-blur-xl hover:border-primary/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <Wrench className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Proyectos & Servicios</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Crea cotizaciones profesionales y gestiona proyectos de principio a fin.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <span>Cotizador con PDF automático</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <span>Control de gastos vs presupuesto</span>
                </li>
              </ul>
            </motion.div>

            {/* Finanzas - Square Card */}
            <motion.div 
              variants={fadeInUp}
              className="group relative p-8 rounded-3xl border border-border/50 bg-gradient-to-br from-success/10 via-card to-card backdrop-blur-xl hover:border-success/50 hover:shadow-xl hover:shadow-success/10 transition-all duration-300"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success group-hover:bg-success group-hover:text-success-foreground transition-colors duration-300">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Finanzas Simples</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Conoce tu utilidad real registrando ingresos y gastos operacionales.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <span>Caja chica y egresos</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <span>Reportes de utilidad claros</span>
                </li>
              </ul>
            </motion.div>

            {/* CRM */}
            <motion.div 
              variants={fadeInUp}
              className="group relative p-8 rounded-3xl border border-border/50 bg-card/80 backdrop-blur-xl hover:border-primary/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Clientes & Fiados</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Gestiona tu cartera de clientes y lleva el control de cuentas por cobrar.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <span>Base de datos de clientes</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <span>Recordatorio de deudas</span>
                </li>
              </ul>
            </motion.div>

            {/* Analytics */}
            <motion.div 
              variants={fadeInUp}
              className="group relative p-8 rounded-3xl border border-border/50 bg-card/80 backdrop-blur-xl hover:border-primary/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Dashboard en Vivo</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Monitorea ventas, stock y métricas clave en tiempo real.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <span>KPIs actualizados al segundo</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <span>Alertas de stock bajo</span>
                </li>
              </ul>
            </motion.div>

            {/* Velocidad */}
            <motion.div 
              variants={fadeInUp}
              className="group relative p-8 rounded-3xl border border-border/50 bg-gradient-to-br from-card via-card to-success/5 backdrop-blur-xl hover:border-success/50 hover:shadow-xl hover:shadow-success/10 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success group-hover:bg-success group-hover:text-success-foreground transition-colors duration-300">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Ultra Rápido</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Optimizado para funcionar en cualquier dispositivo, incluso con internet lento.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    <span>Mobile-first design</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    <span>Funciona offline</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="mx-auto max-w-3xl text-center mb-16"
            {...fadeInUp}
          >
            <Badge variant="outline" className="mb-4 backdrop-blur-sm">
              Precios Transparentes
            </Badge>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Empieza <span className="bg-gradient-to-r from-success via-success to-primary bg-clip-text text-transparent">gratis</span>, crece cuando quieras
            </h2>
            <p className="text-lg text-muted-foreground">
              Sin contratos, sin letra chica. Paga solo por lo que uses.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
          >
            {/* Plan Gratis */}
            <motion.div 
              variants={fadeInUp}
              className="group relative p-8 rounded-3xl border-2 border-border/50 bg-card/80 backdrop-blur-xl hover:border-border hover:shadow-xl transition-all duration-500"
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Gratis</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl md:text-6xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                    $0
                  </span>
                  <span className="text-muted-foreground text-lg">/mes</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8">
                {[
                  'Hasta 50 ventas/mes',
                  '1 usuario',
                  'Módulos básicos',
                  'Soporte por email'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-success mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="/register" className="block">
                <Button variant="outline" className="w-full group-hover:bg-muted transition-colors" size="lg">
                  Comenzar Ahora
                </Button>
              </Link>
            </motion.div>

            {/* Plan Pro - Featured with BorderBeam */}
            <motion.div 
              variants={fadeInUp}
              className="group relative p-8 rounded-3xl border-2 border-primary/50 bg-gradient-to-br from-card via-card to-primary/5 backdrop-blur-xl shadow-2xl shadow-primary/10 hover:shadow-3xl hover:shadow-primary/20 transition-all duration-500"
            >
              {/* Border Beam Effect */}
              <BorderBeam 
                size={300}
                duration={12}
                borderWidth={2}
                colorFrom="hsl(var(--primary))"
                colorTo="hsl(var(--success))"
                delay={0}
              />
              
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-primary to-success text-primary-foreground shadow-lg">
                  Más Popular
                </Badge>
              </div>
              
              <div className="relative z-10">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">Pro</h3>
                  <div className="flex items-baseline gap-2">
                    <span 
                      className="text-5xl md:text-6xl font-bold bg-gradient-to-br from-primary via-primary to-success bg-clip-text text-transparent"
                      style={{
                        textShadow: '0 0 40px hsl(var(--primary) / 0.3)'
                      }}
                    >
                      $19.990
                    </span>
                    <span className="text-muted-foreground text-lg">/mes</span>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {[
                    { text: 'Ventas ilimitadas', bold: true },
                    { text: 'Hasta 5 usuarios', bold: false },
                    { text: 'Todos los módulos', bold: false },
                    { text: 'Soporte prioritario', bold: false },
                    { text: 'Reportes avanzados', bold: false },
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-success mt-0.5 shrink-0" />
                      <span className={feature.bold ? 'font-semibold' : ''}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href="/register" className="block">
                  <ShimmerButton 
                    className="w-full shadow-lg shadow-primary/25"
                    size="lg"
                  >
                    Prueba 30 días gratis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </ShimmerButton>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <motion.section 
        className="relative py-20 sm:py-32 bg-gradient-to-br from-primary/5 via-background to-success/5 border-y border-border/30 backdrop-blur-sm"
        {...fadeInUp}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <motion.h2 
              className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-6"
              {...fadeInUp}
            >
              Empieza a gestionar tu negocio{' '}
              <span className="bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
                hoy
              </span>
            </motion.h2>
            <motion.p 
              className="text-lg text-muted-foreground mb-10"
              {...fadeInUp}
            >
              Únete a cientos de pequeños negocios chilenos que confían en Tendo
              para crecer sin complicaciones.
            </motion.p>
            <motion.div {...fadeInUp}>
              <Link href="/register">
                <ShimmerButton size="lg" className="text-base h-14 px-10 shadow-xl shadow-primary/25">
                  Crear Cuenta Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </ShimmerButton>
              </Link>
            </motion.div>
            <motion.p 
              className="mt-6 text-sm text-muted-foreground"
              {...fadeInUp}
            >
              No se requiere tarjeta de crédito • Configura en minutos
            </motion.p>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="relative py-12 border-t border-border/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="grid md:grid-cols-4 gap-8 mb-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeInUp}>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25">
                  T
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Tendo
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                El Sistema Operativo para tu negocio. Simple, poderoso, chileno.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <h3 className="font-semibold mb-4">Producto</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-primary transition-colors inline-flex items-center group">
                    Funcionalidades
                    <ArrowRight className="ml-1 h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-primary transition-colors inline-flex items-center group">
                    Precios
                    <ArrowRight className="ml-1 h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                </li>
                <li>
                  <Link href="/login" className="hover:text-primary transition-colors inline-flex items-center group">
                    Iniciar Sesión
                    <ArrowRight className="ml-1 h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              </ul>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <h3 className="font-semibold mb-4">Recursos</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors inline-flex items-center group">
                    Ayuda
                    <ArrowRight className="ml-1 h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors inline-flex items-center group">
                    Tutoriales
                    <ArrowRight className="ml-1 h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors inline-flex items-center group">
                    API
                    <ArrowRight className="ml-1 h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                </li>
              </ul>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors inline-flex items-center group">
                    Privacidad
                    <ArrowRight className="ml-1 h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors inline-flex items-center group">
                    Términos
                    <ArrowRight className="ml-1 h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                </li>
              </ul>
            </motion.div>
          </motion.div>

          <motion.div 
            className="pt-8 border-t border-border/40 text-center text-sm text-muted-foreground"
            {...fadeInUp}
          >
            <p className="flex items-center justify-center gap-1">
              © 2026 Tendo. Hecho con{' '}
              <span className="text-red-500 animate-pulse">❤️</span>
              {' '}en Chile para Pymes chilenas.
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
