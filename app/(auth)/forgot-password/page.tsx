import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ForgotPasswordForm } from './_components/forgot-password-form';

export default async function ForgotPasswordPage() {
  const session = await auth();

  if (session?.user) {
    if (session.user.organizationId) {
      redirect('/dashboard');
    }
    redirect('/onboarding');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <ForgotPasswordForm />
    </div>
  );
}
