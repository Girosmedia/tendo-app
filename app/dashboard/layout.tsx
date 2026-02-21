import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './_components/app-sidebar';
import { ImpersonationBanner } from './_components/impersonation-banner';
import { MobileTabBar } from './_components/mobile-tabbar';
import { TopbarActions } from './_components/topbar-actions';
import { SidebarFloatingToggle } from './_components/sidebar-floating-toggle';
import { Toaster } from '@/components/ui/sonner';
import { db } from '@/lib/db';
import { getActiveImpersonation } from '@/app/actions/impersonation';
import { resolveEntitlements } from '@/lib/entitlements';

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
  const [organization, sidebarUser] = await Promise.all([
    db.organization.findUnique({
      where: { id: organizationId },
      select: {
        name: true,
        logoUrl: true,
        status: true,
        plan: true,
        modules: true,
        subscription: {
          select: {
            planId: true,
          },
        },
        settings: {
          select: {
            logoUrl: true,
            logoDarkUrl: true,
          },
        },
      },
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        image: true,
        jobTitle: true,
        isSuperAdmin: true,
      },
    }),
  ]);

  const organizationLogo = organization?.settings?.logoUrl || organization?.logoUrl || null;
  const organizationLogoDark = organization?.settings?.logoDarkUrl || null;
  const entitlements = organization
    ? resolveEntitlements({
        organizationPlan: organization.plan,
        subscriptionPlanId: organization.subscription?.planId,
        organizationModules: organization.modules,
      })
    : null;
  const enabledModules = entitlements?.effectiveModules ?? [];

  if (!session.user.isSuperAdmin && organization?.status === 'SUSPENDED') {
    redirect('/suspended');
  }

  return (
    <SidebarProvider>
      {impersonation && (
        <ImpersonationBanner organizationName={organization?.name || 'Organización'} />
      )}
      <div
        className="flex min-h-screen w-full flex-col bg-background"
        style={impersonation ? { marginTop: '48px' } : {}}
      >
        {/* ── Topbar full-width ── */}
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border/40 bg-background/95 px-3 backdrop-blur supports-backdrop-filter:bg-background/60">
          {/* Brand */}
          <div className="flex shrink-0 items-center gap-2.5">
            {organizationLogo ? (
              <div className="flex h-8 max-w-32 items-center">
                <div className={!organizationLogoDark ? 'dark:rounded-md dark:bg-white dark:px-1 dark:py-0.5' : ''}>
                  <img
                    src={organizationLogo}
                    alt={organization?.name || 'Logo'}
                    className={organizationLogoDark ? 'h-7 w-auto max-w-32 object-contain dark:hidden' : 'h-7 w-auto max-w-32 object-contain'}
                  />
                  {organizationLogoDark && (
                    <img
                      src={organizationLogoDark}
                      alt={organization?.name || 'Logo'}
                      className="hidden h-7 w-auto max-w-32 object-contain dark:block"
                    />
                  )}
                </div>
              </div>
            ) : (
              <span className="text-sm font-semibold tracking-tight">
                {organization?.name || 'Dashboard'}
              </span>
            )}
          </div>

          <TopbarActions />
        </header>

        {/* ── Contenido: sidebar + main ── */}
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar
            user={{
              name: sidebarUser?.name ?? session.user.name,
              email: sidebarUser?.email ?? session.user.email,
              image: sidebarUser?.image ?? session.user.image,
              jobTitle: sidebarUser?.jobTitle ?? session.user.jobTitle,
              isSuperAdmin: sidebarUser?.isSuperAdmin ?? session.user.isSuperAdmin,
            }}
            organizationName={organization?.name}
            organizationLogo={organizationLogo}
            organizationLogoDark={organizationLogoDark}
            enabledModules={enabledModules}
          />
          <main className="flex-1 overflow-y-auto">
            <div className="space-y-4 p-3 pb-20 md:space-y-8 md:p-8 md:pb-8">{children}</div>
          </main>
        </div>
      </div>
      <MobileTabBar enabledModules={enabledModules} />
      <SidebarFloatingToggle />
      <Toaster />
    </SidebarProvider>
  );
}
