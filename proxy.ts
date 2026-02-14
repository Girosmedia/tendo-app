import { auth } from '@/auth';

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const hasOrganization = !!req.auth?.user?.organizationId;
  const isSuperAdmin = !!req.auth?.user?.isSuperAdmin;

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
