import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { LoginForm } from './_components/login-form';

export default async function LoginPage() {
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <LoginForm />
    </div>
  );
}
