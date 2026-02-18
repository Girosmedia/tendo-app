import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { changePasswordSchema } from '@/lib/validators/auth';
import { logAuditAction } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedFields = changePasswordSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validatedFields.data;

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    });

    if (!user?.password) {
      return NextResponse.json(
        { error: 'No se pudo validar la contraseña actual' },
        { status: 400 }
      );
    }

    const currentPasswordMatches = await bcrypt.compare(currentPassword, user.password);

    if (!currentPasswordMatches) {
      return NextResponse.json(
        { error: 'La contraseña actual es incorrecta' },
        { status: 400 }
      );
    }

    const samePassword = await bcrypt.compare(newPassword, user.password);
    if (samePassword) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe ser distinta a la actual' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'CHANGE_PASSWORD',
      resource: 'User',
      resourceId: session.user.id,
      changes: { via: 'authenticated_user' },
    });

    return NextResponse.json({
      message: 'Tu contraseña fue actualizada correctamente',
    });
  } catch (error) {
    console.error('Error en change-password:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
