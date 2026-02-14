import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logAuditAction } from '@/lib/audit';

const updateMembershipSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
});

// Actualizar rol de membresía
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedFields = updateMembershipSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validatedFields.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { id } = await context.params;
    const { role } = validatedFields.data;

    const membership = await db.member.findUnique({
      where: { id },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Membresía no encontrada' },
        { status: 404 }
      );
    }

    const updatedMembership = await db.member.update({
      where: { id },
      data: { role },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Audit log
    await logAuditAction({
      userId: session.user.id,
      action: 'UPDATE_MEMBERSHIP_ROLE',
      resource: 'Member',
      resourceId: id,
      changes: { from: membership.role, to: role },
    });

    return NextResponse.json({
      message: 'Rol actualizado correctamente',
      membership: updatedMembership,
    });
  } catch (error) {
    console.error('Error al actualizar membresía:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Eliminar membresía
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const membership = await db.member.findUnique({
      where: { id },
      include: {
        organization: { select: { name: true } },
        user: { select: { email: true, currentOrganizationId: true } },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Membresía no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que no sea el último OWNER de la organización
    if (membership.role === 'OWNER') {
      const ownersCount = await db.member.count({
        where: {
          organizationId: membership.organizationId,
          role: 'OWNER',
        },
      });

      if (ownersCount === 1) {
        return NextResponse.json(
          { error: 'No se puede eliminar el último propietario de la organización' },
          { status: 400 }
        );
      }
    }

    // Si esta era la org actual del usuario, resetearla
    if (membership.user.currentOrganizationId === membership.organizationId) {
      await db.user.update({
        where: { id: membership.userId },
        data: { currentOrganizationId: null },
      });
    }

    await db.member.delete({
      where: { id },
    });

    // Audit log
    await logAuditAction({
      userId: session.user.id,
      action: 'REMOVE_USER_FROM_ORGANIZATION',
      resource: 'Member',
      resourceId: id,
      changes: {
        userId: membership.userId,
        userEmail: membership.user.email,
        organizationId: membership.organizationId,
        organizationName: membership.organization.name,
        role: membership.role,
      },
    });

    return NextResponse.json({
      message: 'Usuario removido de la organización',
    });
  } catch (error) {
    console.error('Error al eliminar membresía:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
