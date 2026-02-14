import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { createCustomerSchema } from '@/lib/validators/customer';
import { logAuditAction } from '@/lib/audit';

export async function GET(request: Request) {
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

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');

    // Construir filtros
    const where: any = {
      organizationId: organization.id,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { rut: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const customers = await db.customer.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
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

    const organization = await getCurrentOrganization();

    if (!organization) {
      return NextResponse.json(
        { error: 'No perteneces a ninguna organización' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedFields = createCustomerSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validatedFields.data;

    // Verificar si ya existe un cliente con el mismo RUT
    if (data.rut) {
      const existingCustomer = await db.customer.findFirst({
        where: {
          organizationId: organization.id,
          rut: data.rut,
        },
      });

      if (existingCustomer) {
        return NextResponse.json(
          { error: 'Ya existe un cliente con este RUT' },
          { status: 400 }
        );
      }
    }

    const customer = await db.customer.create({
      data: {
        ...data,
        organizationId: organization.id,
      },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'CREATE_CUSTOMER',
      resource: 'Customer',
      resourceId: customer.id,
      changes: data as any,
    });

    return NextResponse.json(
      {
        message: 'Cliente creado exitosamente',
        customer,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
