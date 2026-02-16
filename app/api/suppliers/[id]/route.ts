import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { updateSupplierSchema } from '@/lib/validators/accounts-payable';
import { logAuditAction } from '@/lib/audit';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    const { id } = await params;
    const existingSupplier = await db.supplier.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!existingSupplier) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateSupplierSchema.parse(body);

    const supplier = await db.supplier.update({
      where: { id },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.rut !== undefined && { rut: validatedData.rut }),
        ...(validatedData.contactName !== undefined && {
          contactName: validatedData.contactName,
        }),
        ...(validatedData.email !== undefined && { email: validatedData.email }),
        ...(validatedData.phone !== undefined && { phone: validatedData.phone }),
        ...(validatedData.address !== undefined && { address: validatedData.address }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
        ...(validatedData.status !== undefined && { status: validatedData.status }),
      },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'UPDATE_SUPPLIER',
      resource: 'Supplier',
      resourceId: supplier.id,
      changes: validatedData,
    });

    return NextResponse.json({ supplier });
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    return NextResponse.json({ error: 'Error al actualizar proveedor' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    const { id } = await params;
    const supplier = await db.supplier.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    const pendingPayables = await db.accountPayable.count({
      where: {
        organizationId: organization.id,
        supplierId: id,
        status: {
          in: ['PENDING', 'PARTIAL', 'OVERDUE'],
        },
      },
    });

    if (pendingPayables > 0) {
      return NextResponse.json(
        { error: 'No puedes eliminar un proveedor con cuentas pendientes' },
        { status: 400 }
      );
    }

    await db.supplier.delete({
      where: { id },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'DELETE_SUPPLIER',
      resource: 'Supplier',
      resourceId: id,
      changes: {
        name: supplier.name,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    return NextResponse.json({ error: 'Error al eliminar proveedor' }, { status: 500 });
  }
}
