import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logAuditAction, AUDIT_ACTIONS } from '@/lib/audit';

const updateUserSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  email: z.string().email('Email inválido').optional(),
  isSuperAdmin: z.boolean().optional(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación y permisos de super admin
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (!session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'No autorizado. Se requieren permisos de administrador' },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    // Obtener usuario con sus membresías
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        isSuperAdmin: true,
        currentOrganizationId: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          select: {
            id: true,
            role: true,
            organizationId: true,
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación y permisos de super admin
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (!session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'No autorizado. Se requieren permisos de administrador' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validar datos de entrada
    const validatedFields = updateUserSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { id } = await context.params;
    const updateData = validatedFields.data;

    // Verificar que el usuario existe
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Si se está cambiando el email, verificar que no exista
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email: updateData.email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'El email ya está en uso' },
          { status: 400 }
        );
      }
    }

    // Actualizar usuario
    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        isSuperAdmin: true,
        updatedAt: true,
      },
    });

    // Registrar cambios en audit log
    await logAuditAction({
      userId: session.user.id,
      action: AUDIT_ACTIONS.UPDATE_USER,
      resource: 'User',
      resourceId: id,
      changes: {
        from: { name: existingUser.name, email: existingUser.email, isSuperAdmin: existingUser.isSuperAdmin },
        to: updateData,
      },
    });

    return NextResponse.json({
      message: 'Usuario actualizado exitosamente',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación y permisos de super admin
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (!session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'No autorizado. Se requieren permisos de administrador' },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    // Prevenir que se elimine a sí mismo
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'No puedes eliminarte a ti mismo' },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar usuario (cascade automático eliminará sessions, accounts, memberships)
    await db.user.delete({
      where: { id },
    });

    // Registrar eliminación en audit log
    await logAuditAction({
      userId: session.user.id,
      action: AUDIT_ACTIONS.DELETE_USER,
      resource: 'User',
      resourceId: id,
      changes: { deleted: { email: existingUser.email, name: existingUser.name } },
    });

    return NextResponse.json({
      message: 'Usuario eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
