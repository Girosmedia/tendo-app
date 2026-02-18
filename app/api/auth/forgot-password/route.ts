import { NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import { db } from '@/lib/db';
import { forgotPasswordSchema } from '@/lib/validators/auth';
import { sendPasswordResetEmail } from '@/lib/email';

function hashResetToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedFields = forgotPasswordSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const email = validatedFields.data.email.toLowerCase();

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (user) {
      const identifier = `password-reset:${email}`;
      const rawToken = randomBytes(32).toString('hex');
      const token = hashResetToken(rawToken);
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      await db.verificationToken.deleteMany({
        where: { identifier },
      });

      await db.verificationToken.create({
        data: {
          identifier,
          token,
          expires,
        },
      });

      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const resetUrl = `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

      try {
        await sendPasswordResetEmail({
          toEmail: email,
          resetUrl,
        });
      } catch (emailError) {
        console.error('Error enviando correo de recuperación:', emailError);
      }
    }

    return NextResponse.json({
      message: 'Si el correo existe, te enviamos instrucciones para recuperar tu contraseña.',
    });
  } catch (error) {
    console.error('Error en forgot-password:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
