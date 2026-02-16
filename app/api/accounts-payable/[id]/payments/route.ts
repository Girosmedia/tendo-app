import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { registerAccountPayablePaymentSchema } from '@/lib/validators/accounts-payable';
import { logAuditAction } from '@/lib/audit';

export async function POST(
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
    const payable = await db.accountPayable.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!payable) {
      return NextResponse.json({ error: 'Cuenta por pagar no encontrada' }, { status: 404 });
    }

    if (payable.status === 'PAID' || Number(payable.balance) <= 0) {
      return NextResponse.json(
        { error: 'La cuenta por pagar ya está saldada' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = registerAccountPayablePaymentSchema.parse(body);

    const currentBalance = Number(payable.balance);
    if (validatedData.paymentAmount > currentBalance) {
      return NextResponse.json(
        { error: 'El pago no puede ser mayor al saldo pendiente' },
        { status: 400 }
      );
    }

    const nextBalance = currentBalance - validatedData.paymentAmount;

    const status =
      nextBalance <= 0
        ? 'PAID'
        : payable.dueDate < new Date()
          ? 'OVERDUE'
          : 'PARTIAL';

    const updatedPayable = await db.accountPayable.update({
      where: { id },
      data: {
        balance: nextBalance,
        status,
        paidAt:
          nextBalance <= 0
            ? validatedData.paidAt
              ? new Date(validatedData.paidAt)
              : new Date()
            : payable.paidAt,
        notes:
          validatedData.notes && validatedData.notes.trim().length > 0
            ? [payable.notes, validatedData.notes].filter(Boolean).join('\n')
            : payable.notes,
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            rut: true,
            status: true,
          },
        },
      },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'REGISTER_ACCOUNT_PAYABLE_PAYMENT',
      resource: 'AccountPayable',
      resourceId: payable.id,
      changes: {
        paymentAmount: validatedData.paymentAmount,
        previousBalance: currentBalance,
        nextBalance,
      },
    });

    return NextResponse.json({ payable: updatedPayable });
  } catch (error) {
    console.error('Error al registrar pago en cuenta por pagar:', error);
    return NextResponse.json(
      { error: 'Error al registrar pago en cuenta por pagar' },
      { status: 500 }
    );
  }
}
