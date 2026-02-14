import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { registerServerSchema } from '@/lib/validators/auth';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validar datos de entrada con Zod
    const validatedFields = registerServerSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, password } = validatedFields.data;

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

    // Crear el usuario
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Usuario creado exitosamente',
        user,
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
