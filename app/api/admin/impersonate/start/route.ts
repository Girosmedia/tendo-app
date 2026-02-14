import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { logAuditAction, AUDIT_ACTIONS } from '@/lib/audit'

/**
 * POST /api/admin/impersonate/start
 * Inicia sesión de impersonation y actualiza el token para incluir impersonationSessionId
 */
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session || !session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      )
    }

    const { organizationId } = await req.json()

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId es requerido' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 404 }
      )
    }

    // Desactivar cualquier sesión de impersonation previa del super admin
    await db.impersonationSession.updateMany({
      where: {
        superAdminId: session.user.id,
        isActive: true,
      },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    })

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

    return NextResponse.json({
      success: true,
      sessionId: impersonationSession.id,
      redirectTo: '/dashboard',
    })
  } catch (error) {
    console.error('Error al iniciar impersonation:', error)
    return NextResponse.json(
      { error: 'Error al iniciar impersonation' },
      { status: 500 }
    )
  }
}
