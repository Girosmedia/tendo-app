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
    <div className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="absolute -left-[10%] top-[20%] h-[60vh] w-[60vh] rounded-full bg-primary/5 blur-[140px]" />
        <div className="absolute -right-[10%] bottom-[20%] h-[60vh] w-[60vh] rounded-full bg-indigo-500/5 blur-[140px]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl">
        <RegisterForm />
      </div>
    </div>
  );
}
