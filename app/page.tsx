'use client'
import Link from 'next/link';
import { 
  ArrowRight, 
  Store, 
  Wrench, 
  DollarSign, 
  Users, 
  BarChart3, 
  Zap,
  Check,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grid-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
              <stop offset="50%" stopColor="hsl(var(--success))" stopOpacity="0.05" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
            </linearGradient>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="url(#grid-gradient)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Animated Gradient Orbs */}
          <g className="animate-float">
            <circle cx="20%" cy="30%" r="300" fill="hsl(var(--primary))" opacity="0.03" />
          </g>
          <g className="animate-float-delayed">
            <circle cx="80%" cy="60%" r="250" fill="hsl(var(--success))" opacity="0.04" />
          </g>
        </svg>
      </div>

      {/* Header */}
      <header className="relative border-b border-border/40 backdrop-blur-sm bg-background/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                T
              </div>
              <span className="text-xl font-semibold">Tendo</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Funcionalidades
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Precios
              </a>
              <Link href="/login">
                <Button variant="ghost" size="sm">Iniciar Sesión</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
                  Comenzar Gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </nav>
            <Link href="/register" className="md:hidden">
              <Button size="sm">Empezar</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 lg:py-36">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 text-xs sm:text-sm">
              <Sparkles className="mr-2 h-3 w-3" />
              El Sistema Operativo para tu Negocio
            </Badge>
            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6">
              Gestiona tu Pyme
              <br />
              <span className="text-primary">sin complicaciones</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Tendo es el primer sistema de gestión diseñado para{' '}
              <strong className="text-foreground">pequeños negocios chilenos</strong>.
              Simple, poderoso y adaptado a cómo trabajas.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto text-base h-12 px-8">
                  Pruébalo Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base h-12 px-8">
                  Ver Demo
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground">
              ✓ Sin tarjeta de crédito &nbsp;•&nbsp; ✓ Configuración en 2 minutos &nbsp;•&nbsp; ✓ Soporte en español
            </p>
          </div>
        </div>
      </section>

      {/* Trust Badge */}
      <section className="relative py-12 border-y border-border/40 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 text-center md:text-left">
            <div>
              <div className="text-3xl font-bold text-foreground">100%</div>
              <div className="text-sm text-muted-foreground">Diseñado para Chile</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">2 min</div>
              <div className="text-sm text-muted-foreground">Para comenzar</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">Gratis</div>
              <div className="text-sm text-muted-foreground">Plan inicial</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">24/7</div>
              <div className="text-sm text-muted-foreground">Acceso en la nube</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="relative py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-6">
              ¿Cansado de sistemas complicados?
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-12">
              Los software tradicionales están diseñados para grandes empresas.
              Son caros, difíciles de usar y no hablan tu idioma.
            </p>
            
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/5">
                <div className="text-destructive mb-3 font-semibold">❌ Complicados</div>
                <p className="text-sm text-muted-foreground">
                  Necesitas capacitación para usar funciones básicas
                </p>
              </div>
              <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/5">
                <div className="text-destructive mb-3 font-semibold">❌ Caros</div>
                <p className="text-sm text-muted-foreground">
                  Pagas por funciones que nunca usarás
                </p>
              </div>
              <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/5">
                <div className="text-destructive mb-3 font-semibold">❌ Genéricos</div>
                <p className="text-sm text-muted-foreground">
                  No se adaptan a tu tipo de negocio
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="features" className="relative py-20 sm:py-28 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Badge variant="outline" className="mb-4">
              La Solución
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-bold mb-6">
              Un sistema que <span className="text-primary">crece</span> contigo
            </h2>
            <p className="text-lg text-muted-foreground">
              Tendo se adapta a tu negocio. Activa solo los módulos que necesitas hoy,
              y expande cuando estés listo.
            </p>
          </div>

          {/* Core Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* POS */}
            <div className="group relative p-8 rounded-2xl border border-border/50 bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Store className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Punto de Venta</h3>
              <p className="text-muted-foreground mb-4">
                Vende rápido con lector de códigos, control de stock y cierre de caja automático.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <span>Interface ultra-rápida</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <span>Control de inventario en tiempo real</span>
                </li>
              </ul>
            </div>

            {/* Servicios */}
            <div className="group relative p-8 rounded-2xl border border-border/50 bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Wrench className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Proyectos & Servicios</h3>
              <p className="text-muted-foreground mb-4">
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
            </div>

            {/* Finanzas */}
            <div className="group relative p-8 rounded-2xl border border-border/50 bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success group-hover:bg-success group-hover:text-success-foreground transition-colors">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Finanzas Simples</h3>
              <p className="text-muted-foreground mb-4">
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
            </div>

            {/* CRM */}
            <div className="group relative p-8 rounded-2xl border border-border/50 bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Clientes & Fiados</h3>
              <p className="text-muted-foreground mb-4">
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
            </div>

            {/* Analytics */}
            <div className="group relative p-8 rounded-2xl border border-border/50 bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Dashboard en Vivo</h3>
              <p className="text-muted-foreground mb-4">
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
            </div>

            {/* Velocidad */}
            <div className="group relative p-8 rounded-2xl border border-border/50 bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success group-hover:bg-success group-hover:text-success-foreground transition-colors">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Ultra Rápido</h3>
              <p className="text-muted-foreground mb-4">
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
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Precios Transparentes
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-bold mb-6">
              Empieza <span className="text-success">gratis</span>, crece cuando quieras
            </h2>
            <p className="text-lg text-muted-foreground">
              Sin contratos, sin letra chica. Paga solo por lo que uses.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plan Gratis */}
            <div className="relative p-8 rounded-2xl border-2 border-border bg-card">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Gratis</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">$0</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-success mt-0.5 shrink-0" />
                  <span>Hasta 50 ventas/mes</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-success mt-0.5 shrink-0" />
                  <span>1 usuario</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-success mt-0.5 shrink-0" />
                  <span>Módulos básicos</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-success mt-0.5 shrink-0" />
                  <span>Soporte por email</span>
                </li>
              </ul>

              <Link href="/register" className="block">
                <Button variant="outline" className="w-full" size="lg">
                  Comenzar Ahora
                </Button>
              </Link>
            </div>

            {/* Plan Pro */}
            <div className="relative p-8 rounded-2xl border-2 border-primary bg-card shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Más Popular</Badge>
              </div>
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">$19.990</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-success mt-0.5 shrink-0" />
                  <span><strong>Ventas ilimitadas</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-success mt-0.5 shrink-0" />
                  <span>Hasta 5 usuarios</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-success mt-0.5 shrink-0" />
                  <span>Todos los módulos</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-success mt-0.5 shrink-0" />
                  <span>Soporte prioritario</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-success mt-0.5 shrink-0" />
                  <span>Reportes avanzados</span>
                </li>
              </ul>

              <Link href="/register" className="block">
                <Button className="w-full" size="lg">
                  Prueba 30 días gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 sm:py-28 bg-primary/5 border-y border-primary/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl sm:text-5xl font-bold mb-6">
              Empieza a gestionar tu negocio <span className="text-primary">hoy</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Únete a cientos de pequeños negocios chilenos que confían en Tendo
              para crecer sin complicaciones.
            </p>
            <Link href="/register">
              <Button size="lg" className="text-base h-14 px-10">
                Crear Cuenta Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="mt-6 text-sm text-muted-foreground">
              No se requiere tarjeta de crédito • Configura en minutos
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 border-t border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                  T
                </div>
                <span className="text-lg font-semibold">Tendo</span>
              </div>
              <p className="text-sm text-muted-foreground">
                El Sistema Operativo para tu negocio. Simple, poderoso, chileno.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Producto</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Precios</a></li>
                <li><Link href="/login" className="hover:text-foreground transition-colors">Iniciar Sesión</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Recursos</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Ayuda</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Tutoriales</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacidad</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Términos</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
            <p>© 2026 Tendo. Hecho con ❤️ en Chile para Pymes chilenas.</p>
          </div>
        </div>
      </footer>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(20px) translateX(-10px); }
        }
        
        .animate-float {
          animation: float 20s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 25s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
