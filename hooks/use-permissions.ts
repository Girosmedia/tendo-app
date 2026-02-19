'use client';

import { useSession } from 'next-auth/react';
import { hasPermission, type Permission, type MemberRole } from '@/lib/constants/permissions';

/**
 * Hook para verificar permisos en componentes cliente
 * 
 * @example
 * ```tsx
 * const { can, role, isLoading } = usePermissions();
 * 
 * return (
 *   <>
 *     {can('products:delete') && (
 *       <Button onClick={deleteProduct}>Eliminar</Button>
 *     )}
 *   </>
 * );
 * ```
 */
export function usePermissions() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const role = session?.user?.memberRole as MemberRole | null;

  /**
   * Verifica si el usuario actual puede ejecutar una acción
   */
  const can = (permission: Permission): boolean => {
    if (!role) return false;
    return hasPermission(role, permission);
  };

  /**
   * Verifica si el usuario NO puede ejecutar una acción
   */
  const cannot = (permission: Permission): boolean => {
    return !can(permission);
  };

  /**
   * Verifica si el usuario tiene uno de los roles especificados
   */
  const hasRole = (roles: MemberRole[]): boolean => {
    if (!role) return false;
    return roles.includes(role);
  };

  /**
   * Helpers de rol
   */
  const isOwner = role === 'OWNER';
  const isAdmin = role === 'ADMIN' || role === 'OWNER';
  const isMember = role === 'MEMBER';

  return {
    can,
    cannot,
    hasRole,
    isOwner,
    isAdmin,
    isMember,
    role,
    isLoading,
  };
}
