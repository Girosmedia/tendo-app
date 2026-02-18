import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logAuditAction } from '@/lib/audit';

const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Token inválido'),
});

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedFields = acceptInvitationSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { token } = validatedFields.data;

    const invitation = await db.teamInvitation.findUnique({
      where: { token },
      select: {
        id: true,
        organizationId: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitación inválida' }, { status: 404 });
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json({ error: 'La invitación ya no está disponible' }, { status: 400 });
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'La invitación está expirada' }, { status: 400 });
    }

    if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Este usuario no corresponde al email de la invitación' },
        { status: 403 }
      );
    }

    const existingMembership = await db.member.findFirst({
      where: {
        userId: session.user.id,
        organizationId: invitation.organizationId,
      },
      select: { id: true },
    });

    await db.$transaction(async (tx) => {
      if (!existingMembership) {
        await tx.member.create({
          data: {
            userId: session.user!.id,
            organizationId: invitation.organizationId,
            role: invitation.role,
          },
        });
      }

      await tx.user.update({
        where: { id: session.user!.id },
        data: { currentOrganizationId: invitation.organizationId },
      });

      await tx.teamInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'ACCEPT_INVITATION',
      resource: 'TeamInvitation',
      resourceId: invitation.id,
      changes: {
        organizationId: invitation.organizationId,
        role: invitation.role,
      } as any,
    });

    return NextResponse.json({
      message: 'Invitación aceptada exitosamente',
      organizationId: invitation.organizationId,
    });
  } catch (error) {
    console.error('Error al aceptar invitación:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}