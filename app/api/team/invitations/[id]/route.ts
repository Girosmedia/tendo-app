import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization, isAdmin } from '@/lib/organization';
import { logAuditAction } from '@/lib/audit';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Solo ADMIN y OWNER pueden revocar invitaciones
    const canRevoke = await isAdmin();
    if (!canRevoke) {
      return NextResponse.json(
        { error: 'No tienes permisos para revocar invitaciones' },
        { status: 403 }
      );
    }

    const organization = await getCurrentOrganization();

    if (!organization) {
      return NextResponse.json(
        { error: 'No perteneces a ninguna organización' },
        { status: 404 }
      );
    }

    const { id } = await params;

    // Verificar que la invitación existe y pertenece a la organización
    const invitation = await db.teamInvitation.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitación no encontrada' },
        { status: 404 }
      );
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Solo se pueden revocar invitaciones pendientes' },
        { status: 400 }
      );
    }

    // Actualizar estado a REVOKED
    await db.teamInvitation.update({
      where: { id },
      data: { status: 'REVOKED' },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'REVOKE_INVITATION',
      resource: 'TeamInvitation',
      resourceId: id,
      changes: {
        email: invitation.email,
      } as any,
    });

    return NextResponse.json({
      message: 'Invitación revocada exitosamente',
    });
  } catch (error) {
    console.error('Error al revocar invitación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
