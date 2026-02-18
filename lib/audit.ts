import { db } from '@/lib/db'

export interface AuditLogData {
  userId: string
  action: string
  resource: string
  resourceId: string
  changes?: Record<string, unknown>
  ipAddress?: string
  isImpersonating?: boolean
  impersonationId?: string
}

/**
 * Registra una acción de auditoría en la base de datos
 */
export async function logAuditAction(data: AuditLogData): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        changes: data.changes as any || null,
        ipAddress: data.ipAddress || null,
        isImpersonating: data.isImpersonating || false,
        impersonationId: data.impersonationId || null,
      },
    })
  } catch (error) {
    // No fallar la operación principal si falla el log
    console.error('Error al crear audit log:', error)
  }
}

/**
 * Alias simplificado para logAuditAction
 * Acepta también organizationId y details que son convertidos al formato correcto
 */
export async function logAudit(data: {
  userId: string;
  organizationId: string;
  action: string;
  resource: string;
  resourceId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  await logAuditAction({
    userId: data.userId,
    action: data.action,
    resource: data.resource,
    resourceId: data.resourceId,
    changes: data.details,
    ipAddress: data.ipAddress,
  });
}

/**
 * Acciones de auditoría predefinidas
 */
export const AUDIT_ACTIONS = {
  // Tenants
  CREATE_TENANT: 'CREATE_TENANT',
  UPDATE_TENANT: 'UPDATE_TENANT',
  DELETE_TENANT: 'DELETE_TENANT',
  
  // Users
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  
  // Memberships
  ADD_USER_TO_ORGANIZATION: 'ADD_USER_TO_ORGANIZATION',
  REMOVE_USER_FROM_ORGANIZATION: 'REMOVE_USER_FROM_ORGANIZATION',
  UPDATE_MEMBERSHIP_ROLE: 'UPDATE_MEMBERSHIP_ROLE',
  
  // Settings
  CREATE_ORGANIZATION_SETTINGS: 'CREATE_ORGANIZATION_SETTINGS',
  UPDATE_ORGANIZATION_SETTINGS: 'UPDATE_ORGANIZATION_SETTINGS',

  // Admin Campaigns
  SEND_ADMIN_CAMPAIGN: 'SEND_ADMIN_CAMPAIGN',
  
  // Impersonation
  IMPERSONATE_USER: 'IMPERSONATE_USER',
  STOP_IMPERSONATE: 'STOP_IMPERSONATE',
  
  // Cash Register
  OPEN_CASH_REGISTER: 'OPEN_CASH_REGISTER',
  CLOSE_CASH_REGISTER: 'CLOSE_CASH_REGISTER',
} as const
