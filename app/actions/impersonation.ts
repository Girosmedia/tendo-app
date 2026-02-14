'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { logAuditAction, AUDIT_ACTIONS } from '@/lib/audit'
import { redirect } from 'next/navigation'

/**
 * Server action para iniciar impersonation
 * Crea la sesión y guarda el ID en una cookie separada
 */
export async function startImpersonation(organizationId: string) {
  const session = await auth()

  if (!session || !session.user.isSuperAdmin) {
    throw new Error('No tienes permisos para realizar esta acción')
  }

  // Verificar que la organización existe
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    include: {
      members: {
        where: { role: 'OWNER' },
        take: 1,
      },
    },
  })

  if (!organization) {
    throw new Error('Organización no encontrada')
  }

  // Crear sesión de impersonation (válida por 30 minutos)
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 30)

  const impersonationSession = await db.impersonationSession.create({
    data: {
      superAdminId: session.user.id,
      targetOrganizationId: organizationId,
      targetUserId: organization.members[0]?.userId || null,
      expiresAt,
    },
  })

  // Registrar en audit log
  await logAuditAction({
    userId: session.user.id,
    action: AUDIT_ACTIONS.IMPERSONATE_USER,
    resource: 'Organization',
    resourceId: organizationId,
    changes: {
      sessionId: impersonationSession.id,
      organizationName: organization.name,
      expiresAt: expiresAt.toISOString(),
    },
  })

  // Guardar el ID de impersonation en una cookie
  const cookieStore = await cookies()
  cookieStore.set('impersonation_session', impersonationSession.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 60, // 30 minutos
  })

  // Redirigir al dashboard
  redirect('/dashboard')
}

/**
 * Server action para salir del modo impersonation
 */
export async function stopImpersonation() {
  const session = await auth()
  const cookieStore = await cookies()
  const impersonationSessionId = cookieStore.get('impersonation_session')?.value

  if (!impersonationSessionId) {
    throw new Error('No estás en modo impersonation')
  }

  // Marcar sesión como terminada
  await db.impersonationSession.update({
    where: { id: impersonationSessionId },
    data: {
      isActive: false,
      endedAt: new Date(),
    },
  })

  // Registrar en audit log
  if (session) {
    await logAuditAction({
      userId: session.user.id,
      action: AUDIT_ACTIONS.STOP_IMPERSONATE,
      resource: 'ImpersonationSession',
      resourceId: impersonationSessionId,
    })
  }

  // Eliminar la cookie de impersonation
  cookieStore.delete('impersonation_session')

  // Redirigir al panel admin
  redirect('/admin')
}

/**
 * Helper para obtener la sesión de impersonation activa
 */
export async function getActiveImpersonation() {
  const cookieStore = await cookies()
  const impersonationSessionId = cookieStore.get('impersonation_session')?.value

  if (!impersonationSessionId) {
    return null
  }

  const impSession = await db.impersonationSession.findUnique({
    where: { id: impersonationSessionId },
  })

  // Si la sesión expiró o fue terminada, limpiar la cookie
  if (!impSession || !impSession.isActive || impSession.expiresAt < new Date()) {
    cookieStore.delete('impersonation_session')
    
    // Si existe y expiró, marcarla como inactiva
    if (impSession && impSession.isActive) {
      await db.impersonationSession.update({
        where: { id: impSession.id },
        data: { isActive: false, endedAt: new Date() },
      })
    }
    
    return null
  }

  return impSession
}

