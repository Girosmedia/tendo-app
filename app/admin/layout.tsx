import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './_components/admin-sidebar';
import { AdminMobileTabBar } from './_components/admin-mobile-tabbar';
import { Toaster } from '@/components/ui/sonner';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Solo super admins pueden acceder
  if (!session?.user) {
    redirect('/login?callbackUrl=/admin');
  }

  if (!session.user.isSuperAdmin) {
    // Si no es super admin pero tiene organización, redirigir al dashboard del tenant
    if (session.user.organizationId) {
      redirect('/dashboard');
    }
    // Si no tiene organización, enviarlo a onboarding
    redirect('/onboarding');
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar user={session.user} />
        <main className="flex-1">
          <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center gap-4 px-4">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">Panel de Administración</h1>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-6 p-4 pb-20 md:space-y-8 md:p-8 md:pb-8">{children}</div>
        </main>
      </div>
      <AdminMobileTabBar />
      <Toaster />
    </SidebarProvider>
  );
}
