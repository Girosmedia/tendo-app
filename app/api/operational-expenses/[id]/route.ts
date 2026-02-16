import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { updateOperationalExpenseSchema } from '@/lib/validators/operational-expense';
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
    const existingExpense = await db.operationalExpense.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!existingExpense) {
      return NextResponse.json({ error: 'Egreso no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateOperationalExpenseSchema.parse(body);

    const expense = await db.operationalExpense.update({
      where: { id },
      data: {
        ...(validatedData.title !== undefined && { title: validatedData.title }),
        ...(validatedData.description !== undefined && {
          description: validatedData.description,
        }),
        ...(validatedData.category !== undefined && { category: validatedData.category }),
        ...(validatedData.amount !== undefined && { amount: validatedData.amount }),
        ...(validatedData.paymentMethod !== undefined && {
          paymentMethod: validatedData.paymentMethod,
        }),
        ...(validatedData.expenseDate !== undefined && {
          expenseDate: validatedData.expenseDate
            ? new Date(validatedData.expenseDate)
            : existingExpense.expenseDate,
        }),
      },
      include: {
        cashRegister: {
          select: {
            id: true,
            status: true,
            openedAt: true,
          },
        },
      },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'UPDATE_OPERATIONAL_EXPENSE',
      resource: 'OperationalExpense',
      resourceId: expense.id,
      changes: validatedData,
    });

    return NextResponse.json({ expense });
  } catch (error) {
    console.error('Error al actualizar egreso operacional:', error);
    return NextResponse.json(
      { error: 'Error al actualizar egreso operacional' },
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
    const expense = await db.operationalExpense.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Egreso no encontrado' }, { status: 404 });
    }

    await db.operationalExpense.delete({
      where: { id },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'DELETE_OPERATIONAL_EXPENSE',
      resource: 'OperationalExpense',
      resourceId: id,
      changes: {
        title: expense.title,
        amount: Number(expense.amount),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar egreso operacional:', error);
    return NextResponse.json(
      { error: 'Error al eliminar egreso operacional' },
      { status: 500 }
    );
  }
}