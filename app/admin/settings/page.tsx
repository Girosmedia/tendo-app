import { cookies } from 'next/headers';
import { PageHeader } from '@/components/ui/page-header';
import { SystemSettingsForm } from '@/app/admin/settings/_components/system-settings-form';

interface SystemSettingsData {
  trialDays: number;
  founderProgramEnabled: boolean;
  founderTrialDays: number;
  founderDiscountPercent: number;
}

async function getSystemSettings(): Promise<SystemSettingsData> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ');

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/admin/system-settings`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader,
    },
  });

  if (!response.ok) {
    throw new Error('No fue posible cargar la configuración del sistema');
  }

  const data = await response.json();
  return data.settings;
}

export default async function AdminSettingsPage() {
  const settings = await getSystemSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parámetros del Sistema"
        description="Configura reglas globales de trial y programa Socio Fundador"
        breadcrumbs={['Admin', 'Parámetros del Sistema']}
      />

      <div className="rounded-lg border bg-card p-6">
        <SystemSettingsForm initialSettings={settings} />
      </div>
    </div>
  );
}
