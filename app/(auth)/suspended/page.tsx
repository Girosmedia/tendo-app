import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Mail, LogOut } from 'lucide-react';

export default async function SuspendedPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.isSuperAdmin) {
    redirect('/admin');
  }

  if (session.user.organizationStatus !== 'SUSPENDED') {
    redirect('/dashboard');
  }

  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-background px-6">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="absolute -right-[5%] -top-[10%] h-[40vh] w-[40vh] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute -bottom-[10%] -left-[5%] h-[40vh] w-[40vh] rounded-full bg-destructive/5 blur-[100px]" />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        {/* Logo */}
        <div className="mb-10">
          <img
            src="/tendo_sin_fondo/logo.svg"
            alt="Tendo"
            className="h-8 w-auto dark:hidden sm:h-10"
          />
          <img
            src="/tendo_sin_fondo/logo_negativo.svg"
            alt="Tendo"
            className="hidden h-8 w-auto dark:block sm:h-10"
          />
        </div>

        {/* Flat SVG Illustration */}
        <div className="mb-8 w-full max-w-[280px] sm:max-w-[320px]">
          <svg viewBox="0 0 400 300" className="h-auto w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Background abstract shapes */}
            <circle cx="200" cy="150" r="120" className="fill-primary/5" />
            <circle cx="200" cy="150" r="80" className="fill-primary/10" />
            
            {/* Main card/window */}
            <rect x="100" y="80" width="200" height="140" rx="12" className="fill-card stroke-border" strokeWidth="2" />
            
            {/* Window header */}
            <path d="M100 92C100 85.3726 105.373 80 112 80H288C294.627 80 300 85.3726 300 92V104H100V92Z" className="fill-muted" />
            <circle cx="116" cy="92" r="4" className="fill-destructive/60" />
            <circle cx="130" cy="92" r="4" className="fill-warning/60" />
            <circle cx="144" cy="92" r="4" className="fill-success/60" />
            
            {/* Content lines */}
            <rect x="124" y="124" width="152" height="8" rx="4" className="fill-muted/60" />
            <rect x="124" y="144" width="110" height="8" rx="4" className="fill-muted/60" />
            <rect x="124" y="164" width="130" height="8" rx="4" className="fill-muted/60" />
            <rect x="124" y="184" width="90" height="8" rx="4" className="fill-muted/60" />
            
            {/* Lock/Suspended badge */}
            <g className="animate-bounce" style={{ animationDuration: '3s' }}>
              <circle cx="280" cy="180" r="36" className="fill-destructive" />
              <path d="M272 176V172C272 167.582 275.582 164 280 164C284.418 164 288 167.582 288 172V176M266 176H294V198C294 200.209 292.209 202 290 202H270C267.791 202 266 200.209 266 198V176Z" className="fill-destructive-foreground" />
              <circle cx="280" cy="188" r="3" className="fill-destructive" />
            </g>
          </svg>
        </div>

        {/* Text Content */}
        <h1 className="mb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Acceso suspendido
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-muted-foreground sm:text-base">
          La suscripción de tu organización se encuentra pausada. Por favor, ponte en contacto con nuestro equipo de soporte para reactivar tu cuenta.
        </p>

        {/* Actions */}
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="mailto:soporte@tendo.cl" className="w-full sm:w-auto">
            <Button size="lg" className="w-full rounded-full">
              <Mail className="mr-2 h-4 w-4" />
              Contactar soporte
            </Button>
          </Link>
          <Link href="/api/auth/signout" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full rounded-full">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
