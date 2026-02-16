import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { updateAccountPayableSchema } from '@/lib/validators/accounts-payable';
import { logAuditAction } from '@/lib/audit';

function resolveStatus(balance: number, dueDate: Date, incomingStatus?: string) {
  if (incomingStatus === 'CANCELED') return 'CANCELED';
  if (incomingStatus === 'PAID') return 'PAID';
  if (balance <= 0) return 'PAID';
  if (dueDate < new Date()) return incomingStatus === 'PARTIAL' ? 'PARTIAL' : 'OVERDUE';
  if (incomingStatus === 'PARTIAL') return 'PARTIAL';
  return 'PENDING';
}

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
    const existingPayable = await db.accountPayable.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!existingPayable) {
      return NextResponse.json({ error: 'Cuenta por pagar no encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateAccountPayableSchema.parse(body);

    const nextBalance =
      validatedData.balance !== undefined ? validatedData.balance : Number(existingPayable.balance);
    const nextDueDate = validatedData.dueDate
      ? new Date(validatedData.dueDate)
      : existingPayable.dueDate;

    const status = resolveStatus(nextBalance, nextDueDate, validatedData.status);

    const payable = await db.accountPayable.update({
      where: { id },
      data: {
        ...(validatedData.supplierId !== undefined && { supplierId: validatedData.supplierId }),
        ...(validatedData.documentType !== undefined && {
          documentType: validatedData.documentType,
        }),
        ...(validatedData.documentNumber !== undefined && {
          documentNumber: validatedData.documentNumber,
        }),
        ...(validatedData.issueDate !== undefined && {
          issueDate: new Date(validatedData.issueDate),
        }),
        ...(validatedData.dueDate !== undefined && {
          dueDate: new Date(validatedData.dueDate),
        }),
        ...(validatedData.amount !== undefined && { amount: validatedData.amount }),
        ...(validatedData.balance !== undefined && { balance: validatedData.balance }),
        ...(validatedData.description !== undefined && {
          description: validatedData.description,
        }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
        ...(validatedData.paidAt !== undefined && {
          paidAt: validatedData.paidAt ? new Date(validatedData.paidAt) : null,
        }),
        status,
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            rut: true,
            status: true,
          },
        },
      },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'UPDATE_ACCOUNT_PAYABLE',
      resource: 'AccountPayable',
      resourceId: payable.id,
      changes: validatedData,
    });

    return NextResponse.json({ payable });
  } catch (error) {
    console.error('Error al actualizar cuenta por pagar:', error);
    return NextResponse.json(
      { error: 'Error al actualizar cuenta por pagar' },
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    const { id } = await params;
    const payable = await db.accountPayable.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!payable) {
      return NextResponse.json({ error: 'Cuenta por pagar no encontrada' }, { status: 404 });
    }

    await db.accountPayable.delete({
      where: { id },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'DELETE_ACCOUNT_PAYABLE',
      resource: 'AccountPayable',
      resourceId: id,
      changes: {
        amount: Number(payable.amount),
        balance: Number(payable.balance),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar cuenta por pagar:', error);
    return NextResponse.json(
      { error: 'Error al eliminar cuenta por pagar' },
      { status: 500 }
    );
  }
}
