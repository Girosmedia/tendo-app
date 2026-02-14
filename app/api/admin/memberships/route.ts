import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logAuditAction, AUDIT_ACTIONS } from '@/lib/audit';

const createMembershipSchema = z.object({
  userId: z.string(),
  organizationId: z.string(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
});

const updateMembershipSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
});

// Agregar usuario a organización
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedFields = createMembershipSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validatedFields.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { userId, organizationId, role } = validatedFields.data;

    // Verificar que no exista ya la membresía
    const existingMembership = await db.member.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'El usuario ya es miembro de esta organización' },
        { status: 400 }
      );
    }

    // Crear la membresía
    const membership = await db.member.create({
      data: {
        userId,
        organizationId,
        role,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Si el usuario no tiene organización actual, asignarle esta
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { currentOrganizationId: true },
    });

    if (!user?.currentOrganizationId) {
      await db.user.update({
        where: { id: userId },
        data: { currentOrganizationId: organizationId },
      });
    }

    // Audit log
    await logAuditAction({
      userId: session.user.id,
      action: 'ADD_USER_TO_ORGANIZATION',
      resource: 'Member',
      resourceId: membership.id,
      changes: { userId, organizationId, role },
    });

    return NextResponse.json({
      message: 'Usuario agregado a la organización',
      membership,
    });
  } catch (error) {
    console.error('Error al crear membresía:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
