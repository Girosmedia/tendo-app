import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { PorPagarPageClient } from './_components/por-pagar-page-client';

export const metadata = {
  title: 'Por Pagar | Tendo',
  description: 'Gestión de proveedores y vencimientos de cuentas por pagar',
};

export default async function PorPagarPage() {
  const session = await auth();

  if (!session?.user?.organizationId) {
    redirect('/login');
  }

  return <PorPagarPageClient />;
}
