import { auth } from '@/auth';
import { getRequiredModulesForApiPath, getRequiredModulesForDashboardPath } from '@/lib/constants/module-routes';

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const hasOrganization = !!req.auth?.user?.organizationId;
  const organizationStatus = req.auth?.user?.organizationStatus;
  const isSuperAdmin = !!req.auth?.user?.isSuperAdmin;
  const isApiRoute = pathname.startsWith('/api');
  const isAuthApiRoute = pathname.startsWith('/api/auth');
  const isHealthApiRoute = pathname.startsWith('/api/health');
  const enabledModules = req.auth?.user?.enabledModules ?? [];

  // Rutas de Super Admin
  const isAdminRoute = pathname.startsWith('/admin');
  
  // Si intenta acceder a /admin sin ser super admin, redirigir
  if (isAdminRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return Response.redirect(loginUrl);
    }
    
    if (!isSuperAdmin) {
      // Si es usuario normal, redirigir al dashboard
      return Response.redirect(new URL('/dashboard', req.url));
    }
    
    // Super admin puede acceder
    return;
  }

  // Rutas protegidas del dashboard
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isSuspendedRoute = pathname.startsWith('/suspended');

  const hasRequiredModules = (requiredModules: string[]) => {
    if (requiredModules.length === 0) {
      return true;
    }
    return requiredModules.some((module) => enabledModules.includes(module));
  };

  // Bloqueo central para APIs de tenants suspendidos
  if (
    isApiRoute &&
    !isAuthApiRoute &&
    !isHealthApiRoute &&
    isLoggedIn &&
    hasOrganization &&
    !isSuperAdmin &&
    organizationStatus === 'SUSPENDED'
  ) {
    return Response.json(
      { error: 'Tu organización está suspendida y no puede operar en este momento' },
      { status: 403 }
    );
  }

  // Bloqueo por módulo para APIs
  if (
    isApiRoute &&
    !isAuthApiRoute &&
    !isHealthApiRoute &&
    isLoggedIn &&
    hasOrganization &&
    !isSuperAdmin
  ) {
    const requiredModules = getRequiredModulesForApiPath(pathname);
    if (!hasRequiredModules(requiredModules)) {
      return Response.json(
        { error: 'Este módulo no está habilitado para tu organización' },
        { status: 403 }
      );
    }
  }

  // Si intenta acceder al dashboard sin estar autenticado
  if (isDashboardRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return Response.redirect(loginUrl);
  }

  // Si está autenticado pero no tiene organización
  if (isDashboardRoute && isLoggedIn && !hasOrganization) {
    // Si es super admin, redirigir al panel de admin en lugar de onboarding
    if (isSuperAdmin) {
      return Response.redirect(new URL('/admin', req.url));
    }
    // Si es usuario normal, redirigir a onboarding
    return Response.redirect(new URL('/onboarding', req.url));
  }

  // Si está suspendido, no puede acceder al dashboard
  if (isDashboardRoute && isLoggedIn && hasOrganization && !isSuperAdmin && organizationStatus === 'SUSPENDED') {
    return Response.redirect(new URL('/suspended', req.url));
  }

  // Bloqueo por módulo para rutas del dashboard
  if (isDashboardRoute && isLoggedIn && hasOrganization && !isSuperAdmin) {
    const requiredModules = getRequiredModulesForDashboardPath(pathname);
    if (!hasRequiredModules(requiredModules)) {
      return Response.redirect(new URL('/dashboard', req.url));
    }
  }

  // Si intenta abrir /suspended sin estar suspendido, volver al dashboard
  if (isSuspendedRoute && isLoggedIn && (isSuperAdmin || organizationStatus !== 'SUSPENDED')) {
    return Response.redirect(new URL('/dashboard', req.url));
  }

  return;
});

export const proxyConfig = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (Auth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
