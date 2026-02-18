import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { sendAdminPasswordResetEmail } from '@/lib/email';
import { logAuditAction, AUDIT_ACTIONS } from '@/lib/audit';

function generateTemporaryPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from({ length: 10 })
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join('');
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'No autorizado. Se requieren permisos de administrador' },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const user = await db.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      await tx.verificationToken.deleteMany({
        where: { identifier: `password-reset:${user.email.toLowerCase()}` },
      });

      await tx.session.deleteMany({
        where: { userId: user.id },
      });
    });

    let emailSent = true;
    try {
      await sendAdminPasswordResetEmail({
        toEmail: user.email,
        temporaryPassword,
      });
    } catch (emailError) {
      emailSent = false;
      console.error('Error enviando correo de reset admin:', emailError);
    }

    await logAuditAction({
      userId: session.user.id,
      action: AUDIT_ACTIONS.UPDATE_USER,
      resource: 'User',
      resourceId: user.id,
      changes: {
        operation: 'ADMIN_RESET_PASSWORD',
        emailSent,
      },
    });

    if (!emailSent) {
      return NextResponse.json({
        message: 'Contraseña restablecida, pero falló el envío de correo. Entrega la clave temporal manualmente.',
        temporaryPassword,
      });
    }

    return NextResponse.json({
      message: 'Contraseña restablecida y enviada al correo del usuario',
    });
  } catch (error) {
    console.error('Error en admin reset-password:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
