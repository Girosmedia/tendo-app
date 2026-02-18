import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { registerServerSchema } from '@/lib/validators/auth';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { sendUserWelcomeEmail } from '@/lib/email';

const registerWithInvitationSchema = registerServerSchema.safeExtend({
  invitationToken: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validar datos de entrada con Zod
    const validatedFields = registerWithInvitationSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, password, invitationToken } = validatedFields.data;

    // Verificar si el email ya está registrado
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 400 }
      );
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    let invitation:
      | {
          id: string;
          organizationId: string;
          role: 'ADMIN' | 'MEMBER' | 'OWNER';
          email: string;
        }
      | null = null;

    if (invitationToken) {
      const existingInvitation = await db.teamInvitation.findUnique({
        where: { token: invitationToken },
        select: {
          id: true,
          organizationId: true,
          role: true,
          email: true,
          status: true,
          expiresAt: true,
        },
      });

      if (!existingInvitation) {
        return NextResponse.json({ error: 'Invitación inválida' }, { status: 400 });
      }

      if (existingInvitation.status !== 'PENDING') {
        return NextResponse.json({ error: 'La invitación ya no está disponible' }, { status: 400 });
      }

      if (existingInvitation.expiresAt < new Date()) {
        return NextResponse.json({ error: 'La invitación está expirada' }, { status: 400 });
      }

      if (existingInvitation.email.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json(
          { error: 'Este correo no coincide con la invitación recibida' },
          { status: 400 }
        );
      }

      invitation = {
        id: existingInvitation.id,
        organizationId: existingInvitation.organizationId,
        role: existingInvitation.role,
        email: existingInvitation.email,
      };
    }

    // Crear el usuario (y asociarlo si viene por invitación)
    const user = await db.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          ...(invitation ? { currentOrganizationId: invitation.organizationId } : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      if (invitation) {
        await tx.member.create({
          data: {
            userId: createdUser.id,
            organizationId: invitation.organizationId,
            role: invitation.role,
          },
        });

        await tx.teamInvitation.update({
          where: { id: invitation.id },
          data: {
            status: 'ACCEPTED',
            acceptedAt: new Date(),
          },
        });
      }

      return createdUser;
    });

    try {
      await sendUserWelcomeEmail({
        toEmail: user.email,
        name: user.name,
      });
    } catch (emailError) {
      console.error('Error enviando email de bienvenida de registro:', emailError);
    }

    return NextResponse.json(
      {
        message: 'Usuario creado exitosamente',
        user,
        invitationAccepted: Boolean(invitation),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en registro de usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
