import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization, isAdmin } from '@/lib/organization';
import { logAuditAction } from '@/lib/audit';
import { sendTeamInvitationEmail } from '@/lib/email';
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

    const previousInvitation = await db.teamInvitation.findUnique({
      where: {
        organizationId_email: {
          organizationId: organization.id,
          email,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    // Generar token único
    const token = randomBytes(32).toString('hex');

    // Crear invitación (expira en 7 días)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await db.teamInvitation.upsert({
      where: {
        organizationId_email: {
          organizationId: organization.id,
          email,
        },
      },
      create: {
        organizationId: organization.id,
        email,
        role,
        token,
        invitedBy: session.user.id,
        expiresAt,
      },
      update: {
        role,
        token,
        invitedBy: session.user.id,
        status: 'PENDING',
        acceptedAt: null,
        expiresAt,
      },
    });

    try {
      await sendTeamInvitationEmail({
        toEmail: email,
        organizationName: organization.name,
        role,
        invitationToken: token,
        expiresAt,
      });
    } catch (emailError) {
      console.error('Error enviando invitación por email:', emailError);

      return NextResponse.json(
        { error: 'No se pudo enviar la invitación por correo. Intenta nuevamente.' },
        { status: 500 }
      );
    }

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

    return NextResponse.json({
      message: previousInvitation ? 'Invitación reenviada exitosamente' : 'Invitación enviada exitosamente',
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
