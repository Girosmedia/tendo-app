import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { SettingsForm } from './_components/settings-form';

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (!session.user.organizationId) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">No perteneces a ninguna organización</h2>
          <p className="mt-2 text-muted-foreground">
            Contacta a tu administrador para que te agregue a una organización.
          </p>
        </div>
      </div>
    );
  }

  // Obtener settings de la organización
  const { db } = await import('@/lib/db');
  
  let settings = await db.organizationSettings.findUnique({
    where: { organizationId: session.user.organizationId },
  });

  // Si no existe settings, crearlo con datos de la organización
  if (!settings) {
    const organization = await db.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { name: true, rut: true, logoUrl: true },
    });

    if (organization) {
      settings = await db.organizationSettings.create({
        data: {
          organizationId: session.user.organizationId,
          businessName: organization.name,
          rut: organization.rut,
          logoUrl: organization.logoUrl,
          country: 'Chile',
          timezone: 'America/Santiago',
          currency: 'CLP',
          locale: 'es-CL',
        },
      });
    }
  }

  // Convertir null a undefined para el formulario
  const formData = settings ? {
    businessName: settings.businessName,
    tradeName: settings.tradeName ?? undefined,
    rut: settings.rut,
    logoUrl: settings.logoUrl ?? undefined,
    logoDarkUrl: settings.logoDarkUrl ?? undefined,
    address: settings.address ?? undefined,
    city: settings.city ?? undefined,
    region: settings.region ?? undefined,
    country: settings.country,
    phone: settings.phone ?? undefined,
    email: settings.email ?? undefined,
    website: settings.website ?? undefined,
    taxRegime: settings.taxRegime ?? undefined,
    economicActivity: settings.economicActivity ?? undefined,
    timezone: settings.timezone,
    currency: settings.currency,
    locale: settings.locale,
    cardDebitCommissionRate: Number(settings.cardDebitCommissionRate),
    cardCreditCommissionRate: Number(settings.cardCreditCommissionRate),
  } : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Gestiona la información y parámetros de tu organización
        </p>
      </div>

      <SettingsForm initialData={formData} />
    </div>
  );
}
