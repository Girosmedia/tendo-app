import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { createProjectExpenseSchema } from '@/lib/validators/project';
import { logAuditAction } from '@/lib/audit';
import { z } from 'zod';

// GET /api/services/projects/[id]/expenses - Listar gastos del proyecto
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: projectId } = await params;

    const project = await db.project.findFirst({
      where: {
        id: projectId,
        organizationId: organization.id,
      },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    const expenses = await db.projectExpense.findMany({
      where: {
        organizationId: organization.id,
        projectId,
      },
      orderBy: {
        expenseDate: 'desc',
      },
    });

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error('Error fetching project expenses:', error);
    return NextResponse.json(
      { error: 'Error al obtener gastos del proyecto' },
      { status: 500 }
    );
  }
}

// POST /api/services/projects/[id]/expenses - Registrar gasto y recalcular costo real
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: projectId } = await params;

    const project = await db.project.findFirst({
      where: {
        id: projectId,
        organizationId: organization.id,
      },
      select: {
        id: true,
        actualCost: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = createProjectExpenseSchema.parse(body);

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

    const expense = await db.$transaction(async (tx) => {
      const createdExpense = await tx.projectExpense.create({
        data: {
          organizationId: organization.id,
          projectId,
          milestoneId: validatedData.milestoneId || null,
          description: validatedData.description,
          category: validatedData.category || null,
          amount: validatedData.amount,
          expenseDate: validatedData.expenseDate
            ? new Date(validatedData.expenseDate)
            : new Date(),
          notes: validatedData.notes || null,
          createdBy: session.user.id,
        },
      });

      await tx.project.update({
        where: { id: projectId },
        data: {
          actualCost: {
            increment: validatedData.amount,
          },
        },
      });

      return createdExpense;
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'CREATE_PROJECT_EXPENSE',
      resource: 'ProjectExpense',
      resourceId: expense.id,
      changes: {
        projectId,
        amount: Number(expense.amount),
        description: expense.description,
      },
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error('Error creating project expense:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al registrar gasto del proyecto' },
      { status: 500 }
    );
  }
}
