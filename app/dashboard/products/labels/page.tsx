import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { LabelsContent } from './_components/labels-content';

export const metadata = {
  title: 'Etiquetas de Productos | Tendo',
  description: 'Genera e imprime etiquetas con código de barras',
};

export default async function ProductLabelsPage() {
  const session = await auth();

  if (!session?.user?.organizationId) {
    redirect('/login');
  }

  const organization = await db.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { 
      name: true, 
      settings: { 
        select: { logoUrl: true } 
      } 
    },
  });

  return (
    <LabelsContent 
      organizationName={organization?.name || 'Mi Negocio'}
      organizationLogo={organization?.settings?.logoUrl}
    />
  );
}
