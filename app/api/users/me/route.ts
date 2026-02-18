import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { updateUserProfileSchema } from '@/lib/validators/user-profile';
import { logAuditAction } from '@/lib/audit';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        jobTitle: true,
        email: true,
        image: true,
        isSuperAdmin: true,
        createdAt: true,
        memberships: {
          select: {
            id: true,
            role: true,
            isActive: true,
            createdAt: true,
            organization: {
              select: {
                id: true,
                name: true,
                rut: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();

    if (body && typeof body === 'object' && ('email' in body || 'rut' in body)) {
      return NextResponse.json(
        { error: 'Email y RUT no se pueden actualizar desde Mi Perfil' },
        { status: 400 }
      );
    }

    const validatedFields = updateUserProfileSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updateData = {
      ...validatedFields.data,
      ...(validatedFields.data.jobTitle !== undefined && {
        jobTitle: validatedFields.data.jobTitle.trim() === '' ? null : validatedFields.data.jobTitle.trim(),
      }),
    };

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Debes enviar al menos un campo para actualizar' },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, jobTitle: true, image: true },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        jobTitle: true,
        email: true,
        image: true,
        isSuperAdmin: true,
      },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'UPDATE_OWN_PROFILE',
      resource: 'User',
      resourceId: session.user.id,
      changes: {
        from: {
          name: existingUser.name,
          jobTitle: existingUser.jobTitle,
          image: existingUser.image,
        },
        to: updateData,
      },
    });

    return NextResponse.json({
      message: 'Perfil actualizado correctamente',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error al actualizar perfil de usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
