import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import {
  createTreasuryMovementSchema,
  treasuryMovementQuerySchema,
} from '@/lib/validators/treasury-movement';
import { logAuditAction } from '@/lib/audit';
import { z } from 'zod';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const query = treasuryMovementQuerySchema.parse({
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      search: searchParams.get('search') || undefined,
      type: searchParams.get('type') || undefined,
      category: searchParams.get('category') || undefined,
    });

    const where: any = {
      organizationId: organization.id,
    };

    if (query.startDate || query.endDate) {
      where.occurredAt = {};
      if (query.startDate) where.occurredAt.gte = new Date(query.startDate);
      if (query.endDate) where.occurredAt.lte = new Date(query.endDate);
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { reference: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const movements = await db.treasuryMovement.findMany({
      where,
      include: {
        accountPayable: {
          select: {
            id: true,
            documentNumber: true,
            supplier: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        occurredAt: 'desc',
      },
    });

    return NextResponse.json({ movements });
  } catch (error) {
    console.error('Error al listar movimientos de tesorería:', error);
    return NextResponse.json(
      { error: 'Error al listar movimientos de tesorería' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = createTreasuryMovementSchema.parse(body);

    if (validatedData.accountPayableId) {
      const payable = await db.accountPayable.findFirst({
        where: {
          id: validatedData.accountPayableId,
          organizationId: organization.id,
        },
        select: { id: true },
      });

      if (!payable) {
        return NextResponse.json({ error: 'Cuenta por pagar no encontrada' }, { status: 404 });
      }
    }

    const movement = await db.treasuryMovement.create({
      data: {
        organizationId: organization.id,
        accountPayableId: validatedData.accountPayableId || null,
        type: validatedData.type,
        category: validatedData.category,
        source: validatedData.source,
        title: validatedData.title,
        description: validatedData.description || null,
        reference: validatedData.reference || null,
        amount: validatedData.amount,
        occurredAt: validatedData.occurredAt ? new Date(validatedData.occurredAt) : new Date(),
        createdBy: session.user.id,
      },
      include: {
        accountPayable: {
          select: {
            id: true,
            documentNumber: true,
            supplier: {
              select: { name: true },
            },
          },
        },
      },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'CREATE_TREASURY_MOVEMENT',
      resource: 'TreasuryMovement',
      resourceId: movement.id,
      changes: {
        type: movement.type,
        category: movement.category,
        amount: Number(movement.amount),
      },
    });

    return NextResponse.json({ movement }, { status: 201 });
  } catch (error) {
    console.error('Error al crear movimiento de tesorería:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Error al crear movimiento de tesorería' },
      { status: 500 }
    );
  }
}
