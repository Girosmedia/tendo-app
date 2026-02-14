import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logAuditAction, AUDIT_ACTIONS } from '@/lib/audit';

// Schema de validación para actualizar organización
const updateOrganizationSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'TRIAL']).optional(),
  plan: z.string().optional(),
  modules: z.array(z.string()).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación y permisos
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

    const { id } = await params;
    const body = await request.json();

    // Validar datos de entrada
    const validatedFields = updateOrganizationSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { status, plan, modules } = validatedFields.data;

    // Verificar que la organización existe
    const existingOrg = await db.organization.findUnique({
      where: { id },
    });

    if (!existingOrg) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 404 }
      );
    }

    // Actualizar organización
    const updatedOrganization = await db.organization.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(plan && { plan }),
        ...(modules !== undefined && { modules }),
      },
      include: {
        members: {
          where: { role: 'OWNER' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Registrar cambios en audit log
    await logAuditAction({
      userId: session.user.id,
      action: AUDIT_ACTIONS.UPDATE_TENANT,
      resource: 'Organization',
      resourceId: id,
      changes: {
        from: { status: existingOrg.status, plan: existingOrg.plan, modules: existingOrg.modules },
        to: { status, plan, modules },
      },
    });

    return NextResponse.json({
      message: 'Organización actualizada exitosamente',
      organization: updatedOrganization,
    });
  } catch (error) {
    console.error('Error al actualizar organización:', error);
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
    // Verificar autenticación y permisos
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

    const { id } = await params;

    // Verificar que la organización existe
    const existingOrg = await db.organization.findUnique({
      where: { id },
    });

    if (!existingOrg) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar organización (cascade eliminará members también)
    await db.organization.delete({
      where: { id },
    });

    // Registrar eliminación en audit log
    await logAuditAction({
      userId: session.user.id,
      action: AUDIT_ACTIONS.DELETE_TENANT,
      resource: 'Organization',
      resourceId: id,
      changes: { deleted: { name: existingOrg.name, slug: existingOrg.slug, rut: existingOrg.rut } },
    });

    return NextResponse.json({
      message: 'Organización eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar organización:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
