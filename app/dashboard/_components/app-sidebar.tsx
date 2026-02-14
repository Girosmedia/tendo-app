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
  HandCoins
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
    isSuperAdmin?: boolean;
  };
  organizationName?: string | null;
  organizationLogo?: string | null;
}

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Punto de Venta',
    href: '/dashboard/pos',
    icon: ShoppingCart,
  },
  {
    title: 'Cierre de Caja',
    href: '/dashboard/cash-register',
    icon: Calculator,
  },
  {
    title: 'Productos',
    href: '/dashboard/products',
    icon: Package,
  },
  {
    title: 'Etiquetas',
    href: '/dashboard/products/labels',
    icon: Tag,
  },
  {
    title: 'Clientes',
    href: '/dashboard/customers',
    icon: UsersRound,
  },
  {
    title: 'Fiados',
    href: '/dashboard/fiados',
    icon: HandCoins,
  },
  {
    title: 'Equipo',
    href: '/dashboard/team',
    icon: Users,
  },
  {
    title: 'Configuración',
    href: '/dashboard/settings',
    icon: Settings,
  },
  // Próximos módulos (comentados hasta implementar)
  // {
  //   title: 'Documentos',
  //   href: '/dashboard/documents',
  //   icon: FileText,
  // },
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
            <Avatar className="h-10 w-10 rounded-lg">
              <AvatarImage src={organizationLogo} alt={organizationName || 'Logo'} />
              <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                <Building2 className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <h2 className="truncate text-sm font-semibold">
              {organizationName || 'Mi Empresa'}
            </h2>
            <p className="text-xs text-muted-foreground">Tendo</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
                  {user.email}
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
