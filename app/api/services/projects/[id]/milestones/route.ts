import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { createProjectMilestoneSchema } from '@/lib/validators/project';
import { logAuditAction } from '@/lib/audit';
import { z } from 'zod';

// GET /api/services/projects/[id]/milestones - Listar hitos de proyecto
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

    const milestones = await db.projectMilestone.findMany({
      where: {
        organizationId: organization.id,
        projectId,
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({ milestones });
  } catch (error) {
    console.error('Error fetching project milestones:', error);
    return NextResponse.json(
      { error: 'Error al obtener hitos del proyecto' },
      { status: 500 }
    );
  }
}

// POST /api/services/projects/[id]/milestones - Crear hito de proyecto
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
    const validatedData = createProjectMilestoneSchema.parse(body);

    const lastMilestone = await db.projectMilestone.findFirst({
      where: {
        organizationId: organization.id,
        projectId,
      },
      orderBy: {
        position: 'desc',
      },
      select: {
        position: true,
      },
    });

    const milestone = await db.projectMilestone.create({
      data: {
        organizationId: organization.id,
        projectId,
        title: validatedData.title,
        description: validatedData.description || null,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        estimatedCost: validatedData.estimatedCost ?? null,
        position: (lastMilestone?.position || 0) + 1,
        createdBy: session.user.id,
      },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'CREATE_PROJECT_MILESTONE',
      resource: 'ProjectMilestone',
      resourceId: milestone.id,
      changes: {
        projectId,
        title: milestone.title,
      },
    });

    return NextResponse.json({ milestone }, { status: 201 });
  } catch (error) {
    console.error('Error creating project milestone:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear hito del proyecto' },
      { status: 500 }
    );
  }
}
