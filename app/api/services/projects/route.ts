import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { createProjectSchema } from '@/lib/validators/project';
import { logAuditAction } from '@/lib/audit';
import { z } from 'zod';

// GET /api/services/projects - Listar proyectos
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const projects = await db.project.findMany({
      where: {
        organizationId: organization.id,
        ...(status && { status: status as any }),
      },
      include: {
        quote: {
          select: {
            id: true,
            docNumber: true,
            total: true,
            status: true,
            customer: {
              select: {
                id: true,
                name: true,
                company: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Number.isNaN(limit) ? 100 : Math.min(limit, 300),
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Error al obtener proyectos' },
      { status: 500 }
    );
  }
}

// POST /api/services/projects - Crear proyecto manual
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const validatedData = createProjectSchema.parse(body);

    if (validatedData.quoteId) {
      const quote = await db.document.findFirst({
        where: {
          id: validatedData.quoteId,
          organizationId: organization.id,
          type: 'QUOTE',
        },
        select: { id: true },
      });

      if (!quote) {
        return NextResponse.json(
          { error: 'La cotización asociada no existe' },
          { status: 404 }
        );
      }
    }

    const project = await db.project.create({
      data: {
        organizationId: organization.id,
        quoteId: validatedData.quoteId || null,
        name: validatedData.name,
        description: validatedData.description || null,
        budget: validatedData.budget ?? null,
        actualCost: 0,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : new Date(),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        notes: validatedData.notes || null,
        createdBy: session.user.id,
      },
      include: {
        quote: {
          select: {
            id: true,
            docNumber: true,
            total: true,
          },
        },
      },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'CREATE_PROJECT',
      resource: 'Project',
      resourceId: project.id,
      changes: {
        name: project.name,
        quoteId: project.quoteId,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear proyecto' },
      { status: 500 }
    );
  }
}
