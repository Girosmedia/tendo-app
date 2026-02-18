import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { convertQuoteToProjectSchema } from '@/lib/validators/project';
import { logAuditAction } from '@/lib/audit';
import { z } from 'zod';

// POST /api/services/quotes/[id]/convert - Convertir cotización aprobada a proyecto activo
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

    const { id } = await params;

    const body = await req.json().catch(() => ({}));
    const validatedData = convertQuoteToProjectSchema.parse(body);

    const quote = await db.document.findFirst({
      where: {
        id,
        organizationId: organization.id,
        type: 'QUOTE',
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      );
    }

    if (quote.status !== 'APPROVED') {
      return NextResponse.json(
        {
          error: 'Solo se pueden convertir cotizaciones en estado Aprobada',
        },
        { status: 400 }
      );
    }

    const existingProject = await db.project.findFirst({
      where: {
        organizationId: organization.id,
        quoteId: quote.id,
      },
      select: { id: true },
    });

    if (existingProject) {
      return NextResponse.json(
        { error: 'Esta cotización ya fue convertida a proyecto' },
        { status: 400 }
      );
    }

    const project = await db.project.create({
      data: {
        organizationId: organization.id,
        quoteId: quote.id,
        name:
          validatedData.name ||
          `Proyecto COT-${quote.docNumber}${quote.customer?.name ? ` - ${quote.customer.name}` : ''}`,
        description: validatedData.description ?? quote.notes ?? null,
        status: 'ACTIVE',
        contractedAmount: quote.total,
        budget: quote.total,
        actualCost: 0,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : new Date(),
        notes: validatedData.notes || null,
        createdBy: session.user.id,
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
      },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'CONVERT_QUOTE_TO_PROJECT',
      resource: 'Project',
      resourceId: project.id,
      changes: {
        quoteId: quote.id,
        quoteNumber: quote.docNumber,
        projectName: project.name,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error converting quote to project:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al convertir cotización en proyecto' },
      { status: 500 }
    );
  }
}
