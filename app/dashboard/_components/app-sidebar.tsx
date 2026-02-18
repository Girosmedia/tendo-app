'use client';

import * as React from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  Package, 
  Users, 
  FileText, 
  LogOut, 
  ChevronDown,
  Building2,
  UsersRound,
  ShoppingCart,
  Calculator,
  Tag,
  HandCoins,
  Coins,
  WalletCards,
  Landmark,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface AppSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    jobTitle?: string | null;
    isSuperAdmin?: boolean;
  };
  organizationName?: string | null;
  organizationLogo?: string | null;
}

interface NavigationSubItem {
  title: string;
  href: string;
  match: (path: string) => boolean;
}

interface NavigationItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  match: (path: string) => boolean;
  subItems?: NavigationSubItem[];
}

interface NavigationSection {
  label: string;
  items: NavigationItem[];
}

const navigationSections: NavigationSection[] = [
  {
    label: 'Inicio',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        match: (path) => path === '/dashboard',
      },
    ],
  },
  {
    label: 'Ventas y Caja',
    items: [
      {
        title: 'Punto de Venta',
        href: '/dashboard/pos',
        icon: ShoppingCart,
        match: (path) => path.startsWith('/dashboard/pos'),
        subItems: [
          {
            title: 'Mi Caja',
            href: '/dashboard/mi-caja',
            match: (path) => path.startsWith('/dashboard/mi-caja'),
          },
          {
            title: 'Cierre de Caja',
            href: '/dashboard/cash-register',
            match: (path) => path.startsWith('/dashboard/cash-register'),
          },
          {
            title: 'Documentos',
            href: '/dashboard/documents',
            match: (path) => path.startsWith('/dashboard/documents'),
          },
        ],
      },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      {
        title: 'Productos',
        href: '/dashboard/products',
        icon: Package,
        match: (path) => path.startsWith('/dashboard/products') && !path.startsWith('/dashboard/products/labels'),
        subItems: [
          {
            title: 'Etiquetas',
            href: '/dashboard/products/labels',
            match: (path) => path.startsWith('/dashboard/products/labels'),
          },
        ],
      },
    ],
  },
  {
    label: 'Clientes y Crédito',
    items: [
      {
        title: 'Clientes',
        href: '/dashboard/customers',
        icon: UsersRound,
        match: (path) => path.startsWith('/dashboard/customers'),
      },
      {
        title: 'Fiados',
        href: '/dashboard/fiados',
        icon: HandCoins,
        match: (path) => path.startsWith('/dashboard/fiados'),
      },
      {
        title: 'Por Pagar',
        href: '/dashboard/por-pagar',
        icon: WalletCards,
        match: (path) => path.startsWith('/dashboard/por-pagar'),
      },
    ],
  },
  {
    label: 'Servicios',
    items: [
      {
        title: 'Cotizaciones',
        href: '/dashboard/services/quotes',
        icon: FileText,
        match: (path) => path.startsWith('/dashboard/services/quotes'),
      },
      {
        title: 'Proyectos',
        href: '/dashboard/services/projects',
        icon: Building2,
        match: (path) => path.startsWith('/dashboard/services/projects'),
      },
    ],
  },
  {
    label: 'Cuenta',
    items: [
      {
        title: 'Mi Perfil',
        href: '/dashboard/profile',
        icon: UserRound,
        match: (path) => path.startsWith('/dashboard/profile'),
      },
    ],
  },
  {
    label: 'Organización',
    items: [
      {
        title: 'Contabilidad',
        href: '/dashboard/contabilidad',
        icon: Landmark,
        match: (path) => path.startsWith('/dashboard/contabilidad'),
      },
      {
        title: 'Equipo',
        href: '/dashboard/team',
        icon: Users,
        match: (path) => path.startsWith('/dashboard/team'),
      },
      {
        title: 'Configuración',
        href: '/dashboard/settings',
        icon: Settings,
        match: (path) => path.startsWith('/dashboard/settings'),
      },
    ],
  },
];

export function AppSidebar({ user, organizationName, organizationLogo }: AppSidebarProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  // Auto-cerrar sidebar en móvil al cambiar de ruta
  React.useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [pathname, isMobile, setOpenMobile]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  // Obtener iniciales del nombre para el avatar
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border bg-primary/5 p-4">
        <div className="flex items-center gap-3">
          {organizationLogo ? (
            <div className="flex h-10 max-w-[140px] items-center">
              <img
                src={organizationLogo}
                alt={organizationName || 'Logo'}
                className="h-9 w-auto max-w-[140px] object-contain"
              />
            </div>
          ) : (
            <div className="flex h-8 items-center">
              <img
                src="/tendo_sin_fondo/logo.svg"
                alt="Tendo"
                className="h-7 w-auto dark:hidden"
              />
              <img
                src="/tendo_sin_fondo/logo_negativo.svg"
                alt="Tendo"
                className="hidden h-7 w-auto dark:block"
              />
            </div>
          )}
          {!organizationLogo && (
            <div className="flex-1 overflow-hidden">
              <h2 className="truncate text-sm font-semibold">
                {organizationName || 'Mi Empresa'}
              </h2>
              <p className="text-xs text-muted-foreground">Tendo</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-1 py-1">
        {navigationSections.map((section) => (
          <SidebarGroup key={section.label} className="px-2 py-1">
            <SidebarGroupLabel className="h-6 px-2 text-[11px] uppercase tracking-wide text-sidebar-foreground/60">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {section.items.map((item) => {
                  const isCurrentItemActive = item.match(pathname);
                  const isSubItemActive = item.subItems?.some((subItem) => subItem.match(pathname)) ?? false;
                  const isActive = isCurrentItemActive || isSubItemActive;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} size="sm">
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      {isActive && item.subItems && item.subItems.length > 0 && (
                        <SidebarMenuSub>
                          {item.subItems.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.href}>
                              <SidebarMenuSubButton asChild isActive={subItem.match(pathname)}>
                                <Link href={subItem.href}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-2"
              suppressHydrationWarning
            >
              <Avatar className="h-8 w-8 border-2 border-primary">
                <AvatarImage src={user.image || undefined} alt={user.name || ''} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start overflow-hidden text-left">
                <span className="truncate text-sm font-medium">
                  {user.name || 'Usuario'}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.jobTitle || user.email}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {user.isSuperAdmin && (
              <>
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Panel de Administración
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">
                <UserRound className="mr-2 h-4 w-4" />
                Mi Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
