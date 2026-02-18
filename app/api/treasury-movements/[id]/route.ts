import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { updateTreasuryMovementSchema } from '@/lib/validators/treasury-movement';
import { logAuditAction } from '@/lib/audit';
import { z } from 'zod';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    const { id } = await params;

    const existing = await db.treasuryMovement.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Movimiento no encontrado' }, { status: 404 });
    }

    if (existing.category === 'ACCOUNT_PAYABLE_PAYMENT') {
      return NextResponse.json(
        { error: 'Los movimientos automáticos de pago CxP no se pueden editar' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateTreasuryMovementSchema.parse(body);

    const movement = await db.treasuryMovement.update({
      where: { id },
      data: {
        ...(validatedData.type !== undefined && { type: validatedData.type }),
        ...(validatedData.category !== undefined && { category: validatedData.category }),
        ...(validatedData.source !== undefined && { source: validatedData.source }),
        ...(validatedData.title !== undefined && { title: validatedData.title }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.reference !== undefined && { reference: validatedData.reference }),
        ...(validatedData.amount !== undefined && { amount: validatedData.amount }),
        ...(validatedData.occurredAt !== undefined && {
          occurredAt: validatedData.occurredAt ? new Date(validatedData.occurredAt) : existing.occurredAt,
        }),
      },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'UPDATE_TREASURY_MOVEMENT',
      resource: 'TreasuryMovement',
      resourceId: movement.id,
      changes: validatedData,
    });

    return NextResponse.json({ movement });
  } catch (error) {
    console.error('Error al actualizar movimiento de tesorería:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Error al actualizar movimiento de tesorería' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    const { id } = await params;

    const existing = await db.treasuryMovement.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Movimiento no encontrado' }, { status: 404 });
    }

    if (existing.category === 'ACCOUNT_PAYABLE_PAYMENT') {
      return NextResponse.json(
        { error: 'Los movimientos automáticos de pago CxP no se pueden eliminar' },
        { status: 400 }
      );
    }

    await db.treasuryMovement.delete({ where: { id } });

    await logAuditAction({
      userId: session.user.id,
      action: 'DELETE_TREASURY_MOVEMENT',
      resource: 'TreasuryMovement',
      resourceId: id,
      changes: {
        type: existing.type,
        category: existing.category,
        amount: Number(existing.amount),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar movimiento de tesorería:', error);
    return NextResponse.json(
      { error: 'Error al eliminar movimiento de tesorería' },
      { status: 500 }
    );
  }
}
