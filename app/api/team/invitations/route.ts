import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization, isAdmin } from '@/lib/organization';
import { logAuditAction } from '@/lib/audit';
import { z } from 'zod';
import { randomBytes } from 'crypto';

const createInvitationSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['ADMIN', 'MEMBER']),
});

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const organization = await getCurrentOrganization();

    if (!organization) {
      return NextResponse.json(
        { error: 'No perteneces a ninguna organización' },
        { status: 404 }
      );
    }

    // Obtener invitaciones pendientes
    const invitations = await db.teamInvitation.findMany({
      where: {
        organizationId: organization.id,
        status: 'PENDING',
        expiresAt: {
          gte: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error al obtener invitaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Solo ADMIN y OWNER pueden invitar
    const canInvite = await isAdmin();
    if (!canInvite) {
      return NextResponse.json(
        { error: 'No tienes permisos para invitar usuarios' },
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

    const body = await request.json();
    const validatedFields = createInvitationSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, role } = validatedFields.data;

    // Verificar si el usuario ya es miembro
    const existingUser = await db.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: {
            organizationId: organization.id,
          },
        },
      },
    });

    if (existingUser && existingUser.memberships.length > 0) {
      return NextResponse.json(
        { error: 'El usuario ya es miembro de esta organización' },
        { status: 400 }
      );
    }

    // Verificar si ya existe una invitación pendiente
    const existingInvitation = await db.teamInvitation.findFirst({
      where: {
        organizationId: organization.id,
        email,
        status: 'PENDING',
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Ya existe una invitación pendiente para este email' },
        { status: 400 }
      );
    }

    // Generar token único
    const token = randomBytes(32).toString('hex');

    // Crear invitación (expira en 7 días)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await db.teamInvitation.create({
      data: {
        organizationId: organization.id,
        email,
        role,
        token,
        invitedBy: session.user.id,
        expiresAt,
      },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'CREATE_INVITATION',
      resource: 'TeamInvitation',
      resourceId: invitation.id,
      changes: {
        email,
        role,
      } as any,
    });

    // TODO: Enviar email con la invitación
    // const invitationUrl = `${process.env.NEXTAUTH_URL}/invite/${token}`;
    // await sendInvitationEmail(email, invitationUrl, organization.name);

    return NextResponse.json({
      message: 'Invitación enviada exitosamente',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error al crear invitación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
