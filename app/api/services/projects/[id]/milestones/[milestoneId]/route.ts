import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { updateProjectMilestoneSchema } from '@/lib/validators/project';
import { logAuditAction } from '@/lib/audit';
import { z } from 'zod';

// PATCH /api/services/projects/[id]/milestones/[milestoneId] - Actualizar hito
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
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

    const { id: projectId, milestoneId } = await params;

    const existingMilestone = await db.projectMilestone.findFirst({
      where: {
        id: milestoneId,
        projectId,
        organizationId: organization.id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    if (!existingMilestone) {
      return NextResponse.json(
        { error: 'Hito no encontrado' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = updateProjectMilestoneSchema.parse(body);

    const updatedMilestone = await db.projectMilestone.update({
      where: {
        id: milestoneId,
      },
      data: {
        ...(validatedData.title !== undefined && { title: validatedData.title }),
        ...(validatedData.description !== undefined && {
          description: validatedData.description,
        }),
        ...(validatedData.dueDate !== undefined && {
          dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        }),
        ...(validatedData.estimatedCost !== undefined && {
          estimatedCost: validatedData.estimatedCost,
        }),
        ...(validatedData.isCompleted !== undefined && {
          isCompleted: validatedData.isCompleted,
          completedAt: validatedData.isCompleted ? new Date() : null,
        }),
      },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'UPDATE_PROJECT_MILESTONE',
      resource: 'ProjectMilestone',
      resourceId: updatedMilestone.id,
      changes: {
        before: {
          title: existingMilestone.title,
          isCompleted: existingMilestone.isCompleted,
        },
        after: {
          title: updatedMilestone.title,
          isCompleted: updatedMilestone.isCompleted,
        },
      },
    });

    return NextResponse.json({ milestone: updatedMilestone });
  } catch (error) {
    console.error('Error updating project milestone:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar hito del proyecto' },
      { status: 500 }
    );
  }
}

// DELETE /api/services/projects/[id]/milestones/[milestoneId] - Eliminar hito
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
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

    const { id: projectId, milestoneId } = await params;

    const existingMilestone = await db.projectMilestone.findFirst({
      where: {
        id: milestoneId,
        projectId,
        organizationId: organization.id,
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (!existingMilestone) {
      return NextResponse.json(
        { error: 'Hito no encontrado' },
        { status: 404 }
      );
    }

    await db.projectMilestone.delete({
      where: {
        id: milestoneId,
      },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'DELETE_PROJECT_MILESTONE',
      resource: 'ProjectMilestone',
      resourceId: milestoneId,
      changes: {
        projectId,
        title: existingMilestone.title,
      },
    });

    return NextResponse.json({ message: 'Hito eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting project milestone:', error);
    return NextResponse.json(
      { error: 'Error al eliminar hito del proyecto' },
      { status: 500 }
    );
  }
}
