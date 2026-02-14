import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { logAuditAction, AUDIT_ACTIONS } from '@/lib/audit'
import { encode } from 'next-auth/jwt'

/**
 * POST /api/admin/impersonate
 * Crea una sesión de impersonation para que un super admin acceda como tenant
 */
export async function POST(req: Request) {
  try {
    const session = await auth()

    // Validar que sea super admin
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
        expiresAt: expiresAt.toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      sessionId: impersonationSession.id,
      organizationId,
      expiresAt,
    })
  } catch (error) {
    console.error('Error al crear sesión de impersonation:', error)
    return NextResponse.json(
      { error: 'Error al crear sesión de impersonation' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/impersonate
 * Termina la sesión de impersonation actual
 */
export async function DELETE(req: Request) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const impersonationSessionId = session.user.impersonationSessionId

    if (!impersonationSessionId) {
      return NextResponse.json(
        { error: 'No estás en modo impersonation' },
        { status: 400 }
      )
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
    await logAuditAction({
      userId: session.user.id,
      action: AUDIT_ACTIONS.STOP_IMPERSONATE,
      resource: 'ImpersonationSession',
      resourceId: impersonationSessionId,
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Error al terminar impersonation:', error)
    return NextResponse.json(
      { error: 'Error al terminar impersonation' },
      { status: 500 }
    )
  }
}
