import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ResetPasswordForm } from './_components/reset-password-form';

export default async function ResetPasswordPage() {
  const session = await auth();

  if (session?.user) {
    if (session.user.organizationId) {
      redirect('/dashboard');
    }
    redirect('/onboarding');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <ResetPasswordForm />
    </div>
  );
}
