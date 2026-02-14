import { auth } from '@/auth';
import { db } from '@/lib/db';

/**
 * Obtiene la organización actual del usuario autenticado
 * @returns Organization con sus settings o null si no está autenticado
 */
export async function getCurrentOrganization() {
  const session = await auth();

  if (!session?.user?.organizationId) {
    return null;
  }

  const organization = await db.organization.findUnique({
    where: { id: session.user.organizationId },
    include: {
      settings: true,
      members: {
        where: { userId: session.user.id },
        select: { role: true },
      },
    },
  });

  if (!organization) {
    return null;
  }

  return {
    ...organization,
    userRole: organization.members[0]?.role || null,
  };
}

/**
 * Verifica si el usuario actual tiene un rol específico en su organización
 * @param allowedRoles - Array de roles permitidos
 * @returns true si el usuario tiene uno de los roles permitidos
 */
export async function hasRole(allowedRoles: string[]) {
  const org = await getCurrentOrganization();
  
  if (!org?.userRole) {
    return false;
  }

  return allowedRoles.includes(org.userRole);
}

/**
 * Verifica si el usuario es OWNER o ADMIN de su organización
 */
export async function isAdmin() {
  return hasRole(['OWNER', 'ADMIN']);
}

/**
 * Verifica si un rol específico es OWNER o ADMIN
 */
export function isAdminRole(role: string | null): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

/**
 * Obtiene solo el ID de la organización del usuario autenticado
 * Útil cuando solo necesitas el ID sin cargar toda la organización
 */
export async function getOrganizationId(userId: string): Promise<string | null> {
  const member = await db.member.findFirst({
    where: { userId },
    select: { organizationId: true },
  });
  
  return member?.organizationId || null;
}
