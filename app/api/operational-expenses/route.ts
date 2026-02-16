import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import {
  createOperationalExpenseSchema,
  operationalExpenseQuerySchema,
} from '@/lib/validators/operational-expense';
import { logAuditAction } from '@/lib/audit';

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
    const validatedQuery = operationalExpenseQuerySchema.parse({
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      paymentMethod: searchParams.get('paymentMethod') || undefined,
      cashRegisterId: searchParams.get('cashRegisterId') || undefined,
    });

    const where: any = {
      organizationId: organization.id,
    };

    if (validatedQuery.startDate || validatedQuery.endDate) {
      where.expenseDate = {};
      if (validatedQuery.startDate) {
        where.expenseDate.gte = new Date(validatedQuery.startDate);
      }
      if (validatedQuery.endDate) {
        where.expenseDate.lte = new Date(validatedQuery.endDate);
      }
    }

    if (validatedQuery.search) {
      where.OR = [
        { title: { contains: validatedQuery.search, mode: 'insensitive' } },
        { description: { contains: validatedQuery.search, mode: 'insensitive' } },
      ];
    }

    if (validatedQuery.category) {
      where.category = { contains: validatedQuery.category, mode: 'insensitive' };
    }

    if (validatedQuery.paymentMethod) {
      where.paymentMethod = validatedQuery.paymentMethod;
    }

    if (validatedQuery.cashRegisterId) {
      where.cashRegisterId = validatedQuery.cashRegisterId;
    }

    const expenses = await db.operationalExpense.findMany({
      where,
      include: {
        cashRegister: {
          select: {
            id: true,
            status: true,
            openedAt: true,
          },
        },
      },
      orderBy: {
        expenseDate: 'desc',
      },
    });

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error('Error al listar egresos operacionales:', error);
    return NextResponse.json(
      { error: 'Error al listar egresos operacionales' },
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
    const validatedData = createOperationalExpenseSchema.parse(body);

    let cashRegisterId = validatedData.cashRegisterId || null;

    if (!cashRegisterId) {
      const activeCashRegister = await db.cashRegister.findFirst({
        where: {
          organizationId: organization.id,
          openedBy: session.user.id,
          status: 'OPEN',
        },
        select: {
          id: true,
        },
      });

      cashRegisterId = activeCashRegister?.id || null;
    }

    const expense = await db.operationalExpense.create({
      data: {
        organizationId: organization.id,
        cashRegisterId,
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        amount: validatedData.amount,
        paymentMethod: validatedData.paymentMethod,
        expenseDate: validatedData.expenseDate
          ? new Date(validatedData.expenseDate)
          : new Date(),
        createdBy: session.user.id,
      },
      include: {
        cashRegister: {
          select: {
            id: true,
            status: true,
            openedAt: true,
          },
        },
      },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'CREATE_OPERATIONAL_EXPENSE',
      resource: 'OperationalExpense',
      resourceId: expense.id,
      changes: {
        title: expense.title,
        amount: Number(expense.amount),
        category: expense.category,
      },
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error('Error al crear egreso operacional:', error);
    return NextResponse.json(
      { error: 'Error al crear egreso operacional' },
      { status: 500 }
    );
  }
}