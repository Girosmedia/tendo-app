import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization, isAdmin } from '@/lib/organization';
import { logAuditAction } from '@/lib/audit';
import {
  canChangeMemberRole,
  canRemoveMember,
  canToggleMemberStatus,
  type TeamRole,
} from '@/lib/utils/team-permissions';
import { z } from 'zod';

const updateMemberSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
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

    // Solo ADMIN y OWNER pueden modificar miembros
    const canManage = await isAdmin();
    if (!canManage) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar miembros' },
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

    const actorRole = (organization.userRole ?? null) as TeamRole | null;

    const { id } = await params;
    const body = await request.json();
    const validatedFields = updateMemberSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Verificar que el miembro existe y pertenece a la organización
    const member = await db.member.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Miembro no encontrado' },
        { status: 404 }
      );
    }

    const isSelfTarget = member.userId === session.user.id;
    const targetRole = member.role as TeamRole;

    // No permitir que se desactive a sí mismo
    if (isSelfTarget && validatedFields.data.isActive === false) {
      return NextResponse.json(
        { error: 'No puedes desactivarte a ti mismo' },
        { status: 400 }
      );
    }

    // No permitir que cambie su propio rol
    if (isSelfTarget && validatedFields.data.role) {
      return NextResponse.json(
        { error: 'No puedes cambiar tu propio rol' },
        { status: 400 }
      );
    }

    if (validatedFields.data.role) {
      const canChangeRole = canChangeMemberRole({
        actorRole,
        targetRole,
        isSelf: isSelfTarget,
      });

      if (!canChangeRole) {
        return NextResponse.json(
          { error: 'No tienes permisos para cambiar el rol de este miembro' },
          { status: 403 }
        );
      }
    }

    if (typeof validatedFields.data.isActive === 'boolean') {
      const canToggleStatus = canToggleMemberStatus({
        actorRole,
        targetRole,
        isSelf: isSelfTarget,
      });

      if (!canToggleStatus) {
        return NextResponse.json(
          { error: 'No tienes permisos para activar/desactivar este miembro' },
          { status: 403 }
        );
      }
    }

    const updatedMember = await db.member.update({
      where: { id },
      data: validatedFields.data,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'UPDATE_MEMBER',
      resource: 'Member',
      resourceId: id,
      changes: {
        from: { role: member.role, isActive: member.isActive },
        to: validatedFields.data,
        targetUser: member.user.email,
      } as any,
    });

    return NextResponse.json({
      message: 'Miembro actualizado exitosamente',
      member: updatedMember,
    });
  } catch (error) {
    console.error('Error al actualizar miembro:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

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

    // Solo ADMIN y OWNER pueden eliminar miembros
    const canManage = await isAdmin();
    if (!canManage) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar miembros' },
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

    const actorRole = (organization.userRole ?? null) as TeamRole | null;

    const { id } = await params;

    // Verificar que el miembro existe y pertenece a la organización
    const member = await db.member.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Miembro no encontrado' },
        { status: 404 }
      );
    }

    const isSelfTarget = member.userId === session.user.id;
    const targetRole = member.role as TeamRole;

    // No permitir que se elimine a sí mismo
    if (isSelfTarget) {
      return NextResponse.json(
        { error: 'No puedes eliminarte a ti mismo' },
        { status: 400 }
      );
    }

    const canDeleteMember = canRemoveMember({
      actorRole,
      targetRole,
      isSelf: isSelfTarget,
    });

    if (!canDeleteMember) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este miembro' },
        { status: 403 }
      );
    }

    // Verificar que no es el último OWNER
    if (member.role === 'OWNER') {
      const ownerCount = await db.member.count({
        where: {
          organizationId: organization.id,
          role: 'OWNER',
        },
      });

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'No puedes eliminar al último propietario de la organización' },
          { status: 400 }
        );
      }
    }

    await db.member.delete({
      where: { id },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'DELETE_MEMBER',
      resource: 'Member',
      resourceId: id,
      changes: {
        targetUser: member.user.email,
        role: member.role,
      } as any,
    });

    return NextResponse.json({
      message: 'Miembro eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar miembro:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
