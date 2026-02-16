import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { updateProjectResourceSchema } from '@/lib/validators/project';
import { logAuditAction } from '@/lib/audit';
import { z } from 'zod';

// PATCH /api/services/projects/[id]/resources/[resourceId] - Actualizar recurso y ajustar costo real
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
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

    const { id: projectId, resourceId } = await params;

    const existingResource = await db.projectResource.findFirst({
      where: {
        id: resourceId,
        projectId,
        organizationId: organization.id,
      },
    });

    if (!existingResource) {
      return NextResponse.json(
        { error: 'Recurso no encontrado' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = updateProjectResourceSchema.parse(body);

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

    const nextQuantity = validatedData.quantity ?? Number(existingResource.quantity);
    const requestedConsumed =
      validatedData.consumedQuantity ?? Number(existingResource.consumedQuantity);
    const nextConsumedQuantity = Math.min(requestedConsumed, nextQuantity);
    const nextUnitCost = validatedData.unitCost ?? Number(existingResource.unitCost);
    const nextTotalCost = nextConsumedQuantity * nextUnitCost;

    const costDelta = nextTotalCost - Number(existingResource.totalCost);

    const updatedResource = await db.$transaction(async (tx) => {
      const resource = await tx.projectResource.update({
        where: {
          id: resourceId,
        },
        data: {
          ...(validatedData.milestoneId !== undefined && {
            milestoneId: validatedData.milestoneId || null,
          }),
          ...(validatedData.name !== undefined && { name: validatedData.name }),
          ...(validatedData.unit !== undefined && { unit: validatedData.unit }),
          ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
          quantity: nextQuantity,
          consumedQuantity: nextConsumedQuantity,
          unitCost: nextUnitCost,
          totalCost: nextTotalCost,
        },
      });

      if (costDelta !== 0) {
        await tx.project.update({
          where: { id: projectId },
          data: {
            actualCost: {
              increment: costDelta,
            },
          },
        });
      }

      return resource;
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'UPDATE_PROJECT_RESOURCE',
      resource: 'ProjectResource',
      resourceId: updatedResource.id,
      changes: {
        projectId,
        previousTotalCost: Number(existingResource.totalCost),
        newTotalCost: Number(updatedResource.totalCost),
      },
    });

    return NextResponse.json({ resource: updatedResource });
  } catch (error) {
    console.error('Error updating project resource:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar recurso del proyecto' },
      { status: 500 }
    );
  }
}

// DELETE /api/services/projects/[id]/resources/[resourceId] - Eliminar recurso y descontar costo
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
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

    const { id: projectId, resourceId } = await params;

    const existingResource = await db.projectResource.findFirst({
      where: {
        id: resourceId,
        projectId,
        organizationId: organization.id,
      },
    });

    if (!existingResource) {
      return NextResponse.json(
        { error: 'Recurso no encontrado' },
        { status: 404 }
      );
    }

    await db.$transaction(async (tx) => {
      await tx.projectResource.delete({
        where: { id: resourceId },
      });

      await tx.project.update({
        where: { id: projectId },
        data: {
          actualCost: {
            decrement: Number(existingResource.totalCost),
          },
        },
      });
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'DELETE_PROJECT_RESOURCE',
      resource: 'ProjectResource',
      resourceId: resourceId,
      changes: {
        projectId,
        name: existingResource.name,
        totalCost: Number(existingResource.totalCost),
      },
    });

    return NextResponse.json({ message: 'Recurso eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting project resource:', error);
    return NextResponse.json(
      { error: 'Error al eliminar recurso del proyecto' },
      { status: 500 }
    );
  }
}
