import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import type { MemberRole } from '@/lib/constants/permissions';

/**
 * Jerarquía de roles: OWNER > ADMIN > MEMBER
 */
const ROLE_HIERARCHY: Record<MemberRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
};

/**
 * Obtiene la membresía (member record) del usuario actual en su organización
 * Incluye caching en el session para evitar queries innecesarias
 */
export async function getCurrentMember(organizationId?: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const orgId = organizationId || session.user.organizationId;

  if (!orgId) {
    return null;
  }

  const member = await db.member.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: orgId,
      },
    },
    select: {
      id: true,
      userId: true,
      organizationId: true,
      role: true,
      isActive: true,
    },
  });

  return member;
}

/**
 * Verifica si el role actual cumple con el rol mínimo requerido
 * según la jerarquía: OWNER > ADMIN > MEMBER
 */
export function hasMinimumRole(currentRole: MemberRole, minimumRole: MemberRole): boolean {
  return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[minimumRole];
}

/**
 * Helper para rutas API: Requiere un rol mínimo
 * Retorna NextResponse con 403 si no cumple
 */
export async function requireRole(minimumRole: MemberRole, organizationId?: string): Promise<{
  member: Awaited<ReturnType<typeof getCurrentMember>>;
  error?: NextResponse;
}> {
  const member = await getCurrentMember(organizationId);

  if (!member) {
    return {
      member: null,
      error: NextResponse.json(
        { error: 'No perteneces a esta organización' },
        { status: 403 }
      ),
    };
  }

  if (!member.isActive) {
    return {
      member: null,
      error: NextResponse.json(
        { error: 'Tu membresía está inactiva' },
        { status: 403 }
      ),
    };
  }

  if (!hasMinimumRole(member.role, minimumRole)) {
    return {
      member: null,
      error: NextResponse.json(
        { error: 'No tienes permisos suficientes para esta acción' },
        { status: 403 }
      ),
    };
  }

  return { member };
}

/**
 * Alias conveniente: Solo OWNER puede ejecutar
 */
export async function requireOwner(organizationId?: string) {
  return requireRole('OWNER', organizationId);
}

/**
 * Alias conveniente: ADMIN o superior puede ejecutar
 */
export async function requireAdmin(organizationId?: string) {
  return requireRole('ADMIN', organizationId);
}

/**
 * Verifica que el usuario tenga la organización correcta
 * Útil para validar rutas con organizationId en el body/query
 */
export async function validateOrganizationAccess(organizationId: string): Promise<{
  hasAccess: boolean;
  error?: NextResponse;
}> {
  const session = await auth();

  if (!session?.user) {
    return {
      hasAccess: false,
      error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }),
    };
  }

  if (session.user.organizationId !== organizationId) {
    return {
      hasAccess: false,
      error: NextResponse.json(
        { error: 'No tienes acceso a esta organización' },
        { status: 403 }
      ),
    };
  }

  return { hasAccess: true };
}

/**
 * Tipos de exports para uso en otros archivos
 */
export type { MemberRole };
export { ROLE_HIERARCHY };
