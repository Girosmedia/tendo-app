import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import bcrypt from 'bcrypt';
import { db } from '@/lib/db';
import { resetPasswordSchema } from '@/lib/validators/auth';
import { logAuditAction } from '@/lib/audit';

function hashResetToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedFields = resetPasswordSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, token, password } = validatedFields.data;
    const normalizedEmail = email.toLowerCase();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'El enlace de recuperación es inválido o expiró' },
        { status: 400 }
      );
    }

    const identifier = `password-reset:${normalizedEmail}`;
    const hashedToken = hashResetToken(token);

    const savedToken = await db.verificationToken.findFirst({
      where: {
        identifier,
        token: hashedToken,
      },
    });

    if (!savedToken || savedToken.expires < new Date()) {
      return NextResponse.json(
        { error: 'El enlace de recuperación es inválido o expiró' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      await tx.verificationToken.deleteMany({
        where: { identifier },
      });

      await tx.session.deleteMany({
        where: { userId: user.id },
      });
    });

    await logAuditAction({
      userId: user.id,
      action: 'RESET_PASSWORD',
      resource: 'User',
      resourceId: user.id,
      changes: { via: 'forgot_password' },
    });

    return NextResponse.json({
      message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.',
    });
  } catch (error) {
    console.error('Error en reset-password:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
