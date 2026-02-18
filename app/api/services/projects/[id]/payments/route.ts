import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { createProjectPaymentSchema } from '@/lib/validators/project';
import { logAuditAction } from '@/lib/audit';
import { z } from 'zod';

export async function GET(
  _req: NextRequest,
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
      select: {
        id: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    const payments = await db.projectPayment.findMany({
      where: {
        organizationId: organization.id,
        projectId: id,
      },
      orderBy: {
        paidAt: 'desc',
      },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Error fetching project payments:', error);
    return NextResponse.json(
      { error: 'Error al obtener cobros del proyecto' },
      { status: 500 }
    );
  }
}

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

    const project = await db.project.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
      select: {
        id: true,
        name: true,
        contractedAmount: true,
        quote: {
          select: {
            total: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = createProjectPaymentSchema.parse(body);

    const alreadyCollectedAggregate = await db.projectPayment.aggregate({
      where: {
        organizationId: organization.id,
        projectId: id,
      },
      _sum: {
        amount: true,
      },
    });

    const alreadyCollected = Number(alreadyCollectedAggregate._sum.amount || 0);
    const contractedAmount = project.contractedAmount !== null
      ? Number(project.contractedAmount)
      : project.quote?.total
        ? Number(project.quote.total)
        : null;

    if (contractedAmount !== null && alreadyCollected + validatedData.amount > contractedAmount) {
      return NextResponse.json(
        {
          error: 'El cobro supera el monto contratado pendiente',
          details: {
            contractedAmount,
            alreadyCollected,
            pendingAmount: Math.max(contractedAmount - alreadyCollected, 0),
          },
        },
        { status: 400 }
      );
    }

    const payment = await db.projectPayment.create({
      data: {
        organizationId: organization.id,
        projectId: id,
        amount: validatedData.amount,
        paymentMethod: validatedData.paymentMethod,
        paidAt: validatedData.paidAt ? new Date(validatedData.paidAt) : new Date(),
        reference: validatedData.reference || null,
        notes: validatedData.notes || null,
        createdBy: session.user.id,
      },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'CREATE_PROJECT_PAYMENT',
      resource: 'ProjectPayment',
      resourceId: payment.id,
      changes: {
        projectId: id,
        amount: Number(payment.amount),
        paymentMethod: payment.paymentMethod,
      },
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error('Error creating project payment:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al registrar cobro del proyecto' },
      { status: 500 }
    );
  }
}
