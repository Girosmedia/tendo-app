import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { CreateOrgForm } from './_components/create-org-form';
import { getSubscriptionSystemConfig } from '@/lib/system-settings';

/**
 * NOTA: El error "Failed to execute 'measure' on 'Performance'" que aparece en consola
 * es un bug conocido de Next.js 16 + Turbopack en modo desarrollo.
 * No afecta la funcionalidad y solo ocurre en desarrollo, no en producción.
 * Referencia: https://github.com/vercel/next.js/issues
 */
export default async function OnboardingPage() {
  const session = await auth();

  // Si no está autenticado, redirigir al login
  if (!session?.user) {
    redirect('/login');
  }

  // Si es super admin, redirigir al panel de administración
  if (session.user.isSuperAdmin) {
    redirect('/admin');
  }

  // Si ya tiene organización, redirigir al dashboard
  if (session.user.organizationId) {
    redirect('/dashboard');
  }

  const systemConfig = await getSubscriptionSystemConfig();

  return (
    <div className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 px-4 py-6 sm:px-6 lg:px-8">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="absolute -left-[10%] top-[20%] h-[60vh] w-[60vh] rounded-full bg-primary/5 blur-[140px]" />
        <div className="absolute -right-[10%] bottom-[20%] h-[60vh] w-[60vh] rounded-full bg-indigo-500/5 blur-[140px]" />
      </div>

      <div className="relative z-10 h-full w-full max-w-7xl">
        <CreateOrgForm systemConfig={systemConfig} />
      </div>
    </div>
  );
}
