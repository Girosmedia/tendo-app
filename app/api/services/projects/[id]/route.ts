import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { updateProjectSchema } from '@/lib/validators/project';
import { logAuditAction } from '@/lib/audit';
import { z } from 'zod';

// GET /api/services/projects/[id] - Obtener proyecto por ID
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

    const { id } = await params;

    const project = await db.project.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
      include: {
        quote: {
          select: {
            id: true,
            docNumber: true,
            status: true,
            total: true,
            customer: {
              select: {
                id: true,
                name: true,
                company: true,
              },
            },
          },
        },
        expenses: {
          orderBy: {
            expenseDate: 'desc',
          },
        },
        resources: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        milestones: {
          orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    const budget = project.budget ? Number(project.budget) : null;
    const actualCost = Number(project.actualCost);
    const variance = budget !== null ? actualCost - budget : null;
    const budgetUsagePercent =
      budget && budget > 0 ? (actualCost / budget) * 100 : null;
    const resourcesCostTotal = project.resources.reduce(
      (sum, resource) => sum + Number(resource.totalCost),
      0
    );
    const expensesCostTotal = project.expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    );
    const milestonesTotal = project.milestones.length;
    const milestonesCompleted = project.milestones.filter(
      (milestone) => milestone.isCompleted
    ).length;
    const milestonesProgressPercent =
      milestonesTotal > 0 ? (milestonesCompleted / milestonesTotal) * 100 : 0;

    const milestoneCostSummary = project.milestones.map((milestone) => {
      const expensesRealCost = project.expenses
        .filter((expense) => expense.milestoneId === milestone.id)
        .reduce((sum, expense) => sum + Number(expense.amount), 0);

      const resourcesRealCost = project.resources
        .filter((resource) => resource.milestoneId === milestone.id)
        .reduce((sum, resource) => sum + Number(resource.totalCost), 0);

      const realCost = expensesRealCost + resourcesRealCost;
      const estimatedCost =
        milestone.estimatedCost !== null ? Number(milestone.estimatedCost) : null;
      const variance = estimatedCost !== null ? realCost - estimatedCost : null;

      return {
        milestoneId: milestone.id,
        title: milestone.title,
        estimatedCost,
        realCost,
        variance,
        dueDate: milestone.dueDate,
        isCompleted: milestone.isCompleted,
      };
    });

    const now = new Date();
    const alerts = {
      projectOverBudget:
        budget !== null && actualCost > budget
          ? {
              overAmount: actualCost - budget,
            }
          : null,
      overdueMilestones: milestoneCostSummary.filter(
        (milestone) =>
          milestone.dueDate &&
          !milestone.isCompleted &&
          milestone.dueDate < now
      ).map((milestone) => ({
        milestoneId: milestone.milestoneId,
        title: milestone.title,
        dueDate: milestone.dueDate,
      })),
      overBudgetMilestones: milestoneCostSummary
        .filter(
          (milestone) =>
            milestone.estimatedCost !== null &&
            milestone.variance !== null &&
            milestone.variance > 0
        )
        .map((milestone) => ({
          milestoneId: milestone.milestoneId,
          title: milestone.title,
          overAmount: milestone.variance,
        })),
    };

    return NextResponse.json({
      project,
      metrics: {
        budget,
        actualCost,
        variance,
        budgetUsagePercent,
        resourcesCostTotal,
        expensesCostTotal,
        milestonesTotal,
        milestonesCompleted,
        milestonesProgressPercent,
        milestoneCostSummary,
      },
      alerts,
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Error al obtener proyecto' },
      { status: 500 }
    );
  }
}

// PATCH /api/services/projects/[id] - Actualizar proyecto
export async function PATCH(
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

    const { id } = await params;

    const existingProject = await db.project.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
      select: {
        id: true,
        status: true,
        name: true,
      },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = updateProjectSchema.parse(body);

    const updatedProject = await db.project.update({
      where: { id },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.description !== undefined && {
          description: validatedData.description,
        }),
        ...(validatedData.status !== undefined && { status: validatedData.status }),
        ...(validatedData.budget !== undefined && { budget: validatedData.budget }),
        ...(validatedData.actualCost !== undefined && {
          actualCost: validatedData.actualCost,
        }),
        ...(validatedData.startDate ? {
          startDate: new Date(validatedData.startDate),
        } : {}),
        ...(validatedData.endDate !== undefined && {
          endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
      },
      include: {
        quote: {
          select: {
            id: true,
            docNumber: true,
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'UPDATE_PROJECT',
      resource: 'Project',
      resourceId: updatedProject.id,
      changes: {
        before: {
          name: existingProject.name,
          status: existingProject.status,
        },
        after: {
          name: updatedProject.name,
          status: updatedProject.status,
        },
      },
    });

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error('Error updating project:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar proyecto' },
      { status: 500 }
    );
  }
}
