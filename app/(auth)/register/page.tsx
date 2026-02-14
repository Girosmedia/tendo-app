import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { RegisterForm } from './_components/register-form';

export default async function RegisterPage() {
  const session = await auth();

  // Si ya está autenticado, redirigir al dashboard o onboarding
  if (session?.user) {
    if (session.user.organizationId) {
      redirect('/dashboard');
    } else {
      redirect('/onboarding');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <RegisterForm />
    </div>
  );
}
