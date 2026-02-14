import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { CreateOrgForm } from './_components/create-org-form';

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <CreateOrgForm />
    </div>
  );
}
