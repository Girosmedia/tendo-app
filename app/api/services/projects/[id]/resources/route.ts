import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { createProjectResourceSchema } from '@/lib/validators/project';
import { logAuditAction } from '@/lib/audit';
import { z } from 'zod';

// GET /api/services/projects/[id]/resources - Listar recursos del proyecto
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

    const resources = await db.projectResource.findMany({
      where: {
        organizationId: organization.id,
        projectId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ resources });
  } catch (error) {
    console.error('Error fetching project resources:', error);
    return NextResponse.json(
      { error: 'Error al obtener recursos del proyecto' },
      { status: 500 }
    );
  }
}

// POST /api/services/projects/[id]/resources - Registrar recurso/material y actualizar costo real
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
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = createProjectResourceSchema.parse(body);

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

    if (validatedData.productId) {
      const product = await db.product.findFirst({
        where: {
          id: validatedData.productId,
          organizationId: organization.id,
        },
        select: { id: true },
      });

      if (!product) {
        return NextResponse.json(
          { error: 'Producto/servicio no encontrado' },
          { status: 404 }
        );
      }
    }

    const quantity = validatedData.quantity;
    const consumedQuantity =
      validatedData.consumedQuantity !== undefined
        ? Math.min(validatedData.consumedQuantity, quantity)
        : 0;
    const totalCost = consumedQuantity * validatedData.unitCost;

    const resource = await db.$transaction(async (tx) => {
      const createdResource = await tx.projectResource.create({
        data: {
          organizationId: organization.id,
          projectId,
          milestoneId: validatedData.milestoneId || null,
          productId: validatedData.productId || null,
          sku: validatedData.sku || null,
          name: validatedData.name,
          unit: validatedData.unit || 'unidad',
          quantity,
          consumedQuantity,
          unitCost: validatedData.unitCost,
          totalCost,
          notes: validatedData.notes || null,
          createdBy: session.user.id,
        },
      });

      await tx.project.update({
        where: { id: projectId },
        data: {
          actualCost: {
            increment: totalCost,
          },
        },
      });

      return createdResource;
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'CREATE_PROJECT_RESOURCE',
      resource: 'ProjectResource',
      resourceId: resource.id,
      changes: {
        projectId,
        name: resource.name,
        totalCost: Number(resource.totalCost),
      },
    });

    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    console.error('Error creating project resource:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al registrar recurso del proyecto' },
      { status: 500 }
    );
  }
}
