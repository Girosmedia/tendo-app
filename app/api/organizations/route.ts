import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { createOrganizationSchema } from '@/lib/validators/auth';
import { generateUniqueSlug } from '@/lib/utils/slugify';
import { cleanRUT } from '@/lib/utils/rut-validator';
import { sendOrganizationCreatedEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validar datos de entrada con Zod
    const validatedFields = createOrganizationSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, rut, logoUrl } = validatedFields.data;

    // Limpiar y validar RUT
    const cleanedRUT = cleanRUT(rut);

    // Verificar si el RUT ya está registrado
    const existingOrg = await db.organization.findUnique({
      where: { rut: cleanedRUT },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Este RUT ya está registrado' },
        { status: 400 }
      );
    }

    // Generar slug único
    const existingSlugs = await db.organization.findMany({
      select: { slug: true },
    });
    const slug = generateUniqueSlug(
      name,
      existingSlugs.map((org: { slug: string }) => org.slug)
    );

    // Crear organización y asignar usuario como OWNER en una transacción
    const result = await db.$transaction(async (tx: any) => {
      // Crear la organización
      const organization = await tx.organization.create({
        data: {
          name,
          slug,
          rut: cleanedRUT,
          logoUrl,
        },
      });

      // Crear la configuración inicial de la organización
      await tx.organizationSettings.create({
        data: {
          organizationId: organization.id,
          businessName: name,
          rut: cleanedRUT,
          logoUrl: logoUrl || null,
          country: 'Chile',
          timezone: 'America/Santiago',
          currency: 'CLP',
          locale: 'es-CL',
        },
      });

      // Crear la membresía del usuario como OWNER
      await tx.member.create({
        data: {
          userId: session.user.id,
          organizationId: organization.id,
          role: 'OWNER',
        },
      });

      // Actualizar el currentOrganizationId del usuario
      await tx.user.update({
        where: { id: session.user.id },
        data: { currentOrganizationId: organization.id },
      });

      return organization;
    });

    if (session.user.email) {
      try {
        await sendOrganizationCreatedEmail({
          toEmail: session.user.email,
          name: session.user.name,
          organizationName: result.name,
        });
      } catch (emailError) {
        console.error('Error enviando email de organización creada:', emailError);
      }
    }

    return NextResponse.json(
      {
        message: 'Organización creada exitosamente',
        organization: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear organización:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener todas las organizaciones del usuario
    const memberships = await db.member.findMany({
      where: { userId: session.user.id },
      include: {
        organization: true,
      },
    });

    const organizations = memberships.map((m: any) => ({
      ...m.organization,
      role: m.role,
    }));

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error('Error al obtener organizaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
