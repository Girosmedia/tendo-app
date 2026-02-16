import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import {
  createSupplierSchema,
  supplierQuerySchema,
} from '@/lib/validators/accounts-payable';
import { logAuditAction } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const query = supplierQuerySchema.parse({
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
    });

    const where: any = {
      organizationId: organization.id,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { rut: { contains: query.search, mode: 'insensitive' } },
        { contactName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const suppliers = await db.supplier.findMany({
      where,
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error('Error al listar proveedores:', error);
    return NextResponse.json({ error: 'Error al listar proveedores' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = createSupplierSchema.parse(body);

    const supplier = await db.supplier.create({
      data: {
        organizationId: organization.id,
        name: validatedData.name,
        rut: validatedData.rut,
        contactName: validatedData.contactName,
        email: validatedData.email,
        phone: validatedData.phone,
        address: validatedData.address,
        notes: validatedData.notes,
        status: validatedData.status,
      },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'CREATE_SUPPLIER',
      resource: 'Supplier',
      resourceId: supplier.id,
      changes: {
        name: supplier.name,
        status: supplier.status,
      },
    });

    return NextResponse.json({ supplier }, { status: 201 });
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    return NextResponse.json({ error: 'Error al crear proveedor' }, { status: 500 });
  }
}
