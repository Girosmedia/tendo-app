import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './_components/app-sidebar';
import { ImpersonationBanner } from './_components/impersonation-banner';
import { MobileTabBar } from './_components/mobile-tabbar';
import { Toaster } from '@/components/ui/sonner';
import { db } from '@/lib/db';
import { getActiveImpersonation } from '@/app/actions/impersonation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Verificar autenticación
  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard');
  }

  // Verificar si hay sesión de impersonation activa
  const impersonation = await getActiveImpersonation();
  
  // Si hay impersonation activa, usar esa organización
  const organizationId = impersonation?.targetOrganizationId || session.user.organizationId;

  // Verificar que tenga una organización
  if (!organizationId) {
    redirect('/onboarding');
  }

  // Obtener datos de la organización
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { 
      name: true,
      logoUrl: true,
    },
  });

  return (
    <SidebarProvider>
      {impersonation && (
        <ImpersonationBanner organizationName={organization?.name || 'Organización'} />
      )}
      <div className="flex min-h-screen w-full bg-background" style={impersonation ? { marginTop: '48px' } : {}}>
        <AppSidebar 
          user={session.user} 
          organizationName={organization?.name}
          organizationLogo={organization?.logoUrl}
        />
        <main className="flex-1">
          <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center gap-4 px-4">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">
                  {organization?.name || 'Dashboard'}
                </h1>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-4 md:space-y-8 p-3 md:p-8 pb-20 md:pb-8">{children}</div>
        </main>
      </div>
      <MobileTabBar />
      <Toaster />
    </SidebarProvider>
  );
}
