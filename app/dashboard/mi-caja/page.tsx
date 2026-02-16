import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { MiCajaPageClient } from './_components/mi-caja-page-client';

export const metadata = {
  title: 'Mi Caja | Tendo',
  description: 'Registro de egresos operacionales y caja chica',
};

export default async function MiCajaPage() {
  const session = await auth();

  if (!session?.user?.organizationId) {
    redirect('/login');
  }

  return <MiCajaPageClient />;
}