import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { updateProjectExpenseSchema } from '@/lib/validators/project';
import { logAuditAction } from '@/lib/audit';
import { z } from 'zod';

// PATCH /api/services/projects/[id]/expenses/[expenseId] - Actualizar gasto y ajustar costo real
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 404 }
      );
    }

    const { id: projectId, expenseId } = await params;

    const existingExpense = await db.projectExpense.findFirst({
      where: {
        id: expenseId,
        projectId,
        organizationId: organization.id,
      },
    });

    if (!existingExpense) {
      return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = updateProjectExpenseSchema.parse(body);

    if (validatedData.milestoneId) {
      const milestone = await db.projectMilestone.findFirst({
        where: {
          id: validatedData.milestoneId,
          organizationId: organization.id,
          projectId,
        },
        select: { id: true },
      });

      if (!milestone) {
        return NextResponse.json(
          { error: 'El hito seleccionado no existe en este proyecto' },
          { status: 404 }
        );
      }
    }

    const nextAmount = validatedData.amount ?? Number(existingExpense.amount);
    const amountDelta = nextAmount - Number(existingExpense.amount);

    const updatedExpense = await db.$transaction(async (tx) => {
      const expense = await tx.projectExpense.update({
        where: { id: expenseId },
        data: {
          ...(validatedData.milestoneId !== undefined && {
            milestoneId: validatedData.milestoneId || null,
          }),
          ...(validatedData.description !== undefined && {
            description: validatedData.description,
          }),
          ...(validatedData.category !== undefined && {
            category: validatedData.category,
          }),
          ...(validatedData.expenseDate !== undefined && {
            expenseDate: validatedData.expenseDate
              ? new Date(validatedData.expenseDate)
              : existingExpense.expenseDate,
          }),
          ...(validatedData.notes !== undefined && {
            notes: validatedData.notes,
          }),
          amount: nextAmount,
        },
      });

      if (amountDelta !== 0) {
        await tx.project.update({
          where: { id: projectId },
          data: {
            actualCost: {
              increment: amountDelta,
            },
          },
        });
      }

      return expense;
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'UPDATE_PROJECT_EXPENSE',
      resource: 'ProjectExpense',
      resourceId: updatedExpense.id,
      changes: {
        projectId,
        previousAmount: Number(existingExpense.amount),
        newAmount: Number(updatedExpense.amount),
      },
    });

    return NextResponse.json({ expense: updatedExpense });
  } catch (error) {
    console.error('Error updating project expense:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar gasto del proyecto' },
      { status: 500 }
    );
  }
}

// DELETE /api/services/projects/[id]/expenses/[expenseId] - Eliminar gasto y ajustar costo real
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 404 }
      );
    }

    const { id: projectId, expenseId } = await params;

    const existingExpense = await db.projectExpense.findFirst({
      where: {
        id: expenseId,
        projectId,
        organizationId: organization.id,
      },
    });

    if (!existingExpense) {
      return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 });
    }

    await db.$transaction(async (tx) => {
      await tx.projectExpense.delete({
        where: { id: expenseId },
      });

      await tx.project.update({
        where: { id: projectId },
        data: {
          actualCost: {
            decrement: Number(existingExpense.amount),
          },
        },
      });
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'DELETE_PROJECT_EXPENSE',
      resource: 'ProjectExpense',
      resourceId: expenseId,
      changes: {
        projectId,
        description: existingExpense.description,
        amount: Number(existingExpense.amount),
      },
    });

    return NextResponse.json({ message: 'Gasto eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting project expense:', error);
    return NextResponse.json(
      { error: 'Error al eliminar gasto del proyecto' },
      { status: 500 }
    );
  }
}
