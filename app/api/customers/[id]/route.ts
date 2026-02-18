import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { updateCustomerSchema } from '@/lib/validators/customer';
import { logAuditAction } from '@/lib/audit';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const customer = await db.customer.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const validatedFields = updateCustomerSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Verificar que el cliente existe y pertenece a la organización
    const existingCustomer = await db.customer.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    const data = validatedFields.data;

    // Si se actualiza el RUT, verificar que no exista otro cliente con el mismo RUT
    if (data.rut && data.rut !== existingCustomer.rut) {
      const duplicateRUT = await db.customer.findFirst({
        where: {
          organizationId: organization.id,
          rut: data.rut,
          id: { not: id },
        },
      });

      if (duplicateRUT) {
        return NextResponse.json(
          { error: 'Ya existe otro cliente con este RUT' },
          { status: 400 }
        );
      }
    }

    const customer = await db.customer.update({
      where: { id },
      data,
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'UPDATE_CUSTOMER',
      resource: 'Customer',
      resourceId: id,
      changes: {
        from: existingCustomer,
        to: data,
      } as any,
    });

    return NextResponse.json({
      message: 'Cliente actualizado exitosamente',
      customer,
    });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Verificar que el cliente existe y pertenece a la organización
    const customer = await db.customer.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    const [documentsCount, creditsCount, paymentsCount] = await Promise.all([
      db.document.count({
        where: {
          organizationId: organization.id,
          customerId: id,
        },
      }),
      db.credit.count({
        where: {
          organizationId: organization.id,
          customerId: id,
        },
      }),
      db.payment.count({
        where: {
          organizationId: organization.id,
          customerId: id,
        },
      }),
    ]);

    const hasCommercialHistory = documentsCount > 0 || creditsCount > 0 || paymentsCount > 0;

    if (hasCommercialHistory) {
      if (!customer.isActive) {
        return NextResponse.json({
          message: 'El cliente ya está desactivado y mantiene historial comercial.',
        });
      }

      await db.customer.update({
        where: { id },
        data: { isActive: false },
      });

      await logAuditAction({
        userId: session.user.id,
        action: 'DEACTIVATE_CUSTOMER',
        resource: 'Customer',
        resourceId: id,
        changes: {
          customer: customer.name,
          reason: 'HAS_COMMERCIAL_HISTORY',
          documentsCount,
          creditsCount,
          paymentsCount,
        } as any,
      });

      return NextResponse.json({
        message:
          'El cliente tiene historial comercial, por seguridad se desactivó en lugar de eliminarse.',
      });
    }

    await db.customer.delete({
      where: { id },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'DELETE_CUSTOMER',
      resource: 'Customer',
      resourceId: id,
      changes: {
        customer: customer.name,
      } as any,
    });

    return NextResponse.json({
      message: 'Cliente eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
