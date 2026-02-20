import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { hasModuleAccess } from '@/lib/entitlements';

interface ServiceAlert {
  id: string;
  type:
    | 'PROJECT_OVER_BUDGET'
    | 'MILESTONE_OVER_BUDGET'
    | 'MILESTONE_OVERDUE';
  severity: 'high' | 'medium';
  projectId: string;
  projectName: string;
  milestoneId?: string;
  milestoneTitle?: string;
  message: string;
}

// GET /api/services/alerts - Alertas automáticas de proyectos/servicios
export async function GET(req: NextRequest) {
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

    if (!hasModuleAccess({
      organizationPlan: organization.plan,
      subscriptionPlanId: organization.subscription?.planId,
      organizationModules: organization.modules,
    }, 'PROJECTS')) {
      return NextResponse.json({ error: 'Módulo Proyectos no habilitado para tu plan' }, { status: 403 });
    }

    const projects = await db.project.findMany({
      where: {
        organizationId: organization.id,
        status: {
          in: ['ACTIVE', 'ON_HOLD'],
        },
      },
      include: {
        milestones: {
          orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        },
        expenses: true,
        resources: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 200,
    });

    const now = new Date();
    const alerts: ServiceAlert[] = [];

    for (const project of projects) {
      const budget = project.budget !== null ? Number(project.budget) : null;
      const actualCost = Number(project.actualCost);

      if (budget !== null && actualCost > budget) {
        alerts.push({
          id: `project-overbudget-${project.id}`,
          type: 'PROJECT_OVER_BUDGET',
          severity: 'high',
          projectId: project.id,
          projectName: project.name,
          message: `Proyecto sobre presupuesto por ${new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(actualCost - budget)}`,
        });
      }

      for (const milestone of project.milestones) {
        const milestoneExpenses = project.expenses
          .filter((expense) => expense.milestoneId === milestone.id)
          .reduce((sum, expense) => sum + Number(expense.amount), 0);

        const milestoneResources = project.resources
          .filter((resource) => resource.milestoneId === milestone.id)
          .reduce((sum, resource) => sum + Number(resource.totalCost), 0);

        const milestoneRealCost = milestoneExpenses + milestoneResources;
        const milestoneEstimated =
          milestone.estimatedCost !== null ? Number(milestone.estimatedCost) : null;

        if (
          milestoneEstimated !== null &&
          milestoneRealCost > milestoneEstimated
        ) {
          alerts.push({
            id: `milestone-overbudget-${milestone.id}`,
            type: 'MILESTONE_OVER_BUDGET',
            severity: 'medium',
            projectId: project.id,
            projectName: project.name,
            milestoneId: milestone.id,
            milestoneTitle: milestone.title,
            message: `Hito \"${milestone.title}\" sobre estimado por ${new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(milestoneRealCost - milestoneEstimated)}`,
          });
        }

        if (
          milestone.dueDate &&
          !milestone.isCompleted &&
          milestone.dueDate < now
        ) {
          alerts.push({
            id: `milestone-overdue-${milestone.id}`,
            type: 'MILESTONE_OVERDUE',
            severity: 'high',
            projectId: project.id,
            projectName: project.name,
            milestoneId: milestone.id,
            milestoneTitle: milestone.title,
            message: `Hito vencido: \"${milestone.title}\"`,
          });
        }
      }
    }

    const summary = {
      total: alerts.length,
      high: alerts.filter((alert) => alert.severity === 'high').length,
      medium: alerts.filter((alert) => alert.severity === 'medium').length,
      byType: {
        projectOverBudget: alerts.filter((alert) => alert.type === 'PROJECT_OVER_BUDGET').length,
        milestoneOverBudget: alerts.filter((alert) => alert.type === 'MILESTONE_OVER_BUDGET').length,
        milestoneOverdue: alerts.filter((alert) => alert.type === 'MILESTONE_OVERDUE').length,
      },
    };

    return NextResponse.json({
      summary,
      alerts: alerts.slice(0, 50),
    });
  } catch (error) {
    console.error('Error fetching service alerts:', error);
    return NextResponse.json(
      { error: 'Error al obtener alertas de servicios' },
      { status: 500 }
    );
  }
}
