'use client';

import { LayoutDashboard, Building2, Users, Mail, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';

export function AdminMobileTabBar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const tabs = [
    {
      icon: LayoutDashboard,
      label: 'Resumen',
      href: '/admin',
      match: (path: string) => path === '/admin',
    },
    {
      icon: Building2,
      label: 'Tenants',
      href: '/admin/tenants',
      match: (path: string) => path.startsWith('/admin/tenants'),
    },
    {
      icon: Users,
      label: 'Usuarios',
      href: '/admin/users',
      match: (path: string) => path.startsWith('/admin/users'),
    },
    {
      icon: Mail,
      label: 'Campañas',
      href: '/admin/campaigns',
      match: (path: string) => path.startsWith('/admin/campaigns'),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
      aria-label="Navegación principal móvil de administración"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.match(pathname);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex h-full w-full min-h-[44px] flex-col items-center justify-center rounded-lg transition-colors',
                isActive
                  ? 'text-brand-primary'
                  : 'text-muted-foreground hover:text-foreground active:text-brand-primary'
              )}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={cn('mb-1 transition-all', isActive ? 'h-6 w-6' : 'h-5 w-5')}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span
                className={cn(
                  'text-xs transition-all',
                  isActive ? 'font-semibold' : 'font-medium'
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}

        <button
          onClick={() => setOpenMobile(true)}
          className="flex h-full w-full min-h-[44px] flex-col items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground active:text-brand-primary"
          aria-label="Más opciones"
        >
          <Menu className="mb-1 h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          <span className="text-xs font-medium">Más</span>
        </button>
      </div>
    </nav>
  );
}
