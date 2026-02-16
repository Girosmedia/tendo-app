import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import {
  accountPayableQuerySchema,
  createAccountPayableSchema,
} from '@/lib/validators/accounts-payable';
import { logAuditAction } from '@/lib/audit';

function getPayableStatus(dueDate: Date, balance: number) {
  if (balance <= 0) return 'PAID';
  const today = new Date();
  if (dueDate < today) return 'OVERDUE';
  return 'PENDING';
}

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
    const query = accountPayableQuerySchema.parse({
      search: searchParams.get('search') || undefined,
      supplierId: searchParams.get('supplierId') || undefined,
      status: searchParams.get('status') || undefined,
      overdue: searchParams.get('overdue') || undefined,
      startDueDate: searchParams.get('startDueDate') || undefined,
      endDueDate: searchParams.get('endDueDate') || undefined,
    });

    const where: any = {
      organizationId: organization.id,
    };

    if (query.supplierId) {
      where.supplierId = query.supplierId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.overdue) {
      where.status = { in: ['PENDING', 'PARTIAL', 'OVERDUE'] };
      where.dueDate = { lt: new Date() };
    }

    if (query.startDueDate || query.endDueDate) {
      where.dueDate = where.dueDate || {};
      if (query.startDueDate) {
        where.dueDate.gte = new Date(query.startDueDate);
      }
      if (query.endDueDate) {
        where.dueDate.lte = new Date(query.endDueDate);
      }
    }

    if (query.search) {
      where.OR = [
        { description: { contains: query.search, mode: 'insensitive' } },
        { documentNumber: { contains: query.search, mode: 'insensitive' } },
        { supplier: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const payables = await db.accountPayable.findMany({
      where,
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
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ payables });
  } catch (error) {
    console.error('Error al listar cuentas por pagar:', error);
    return NextResponse.json(
      { error: 'Error al listar cuentas por pagar' },
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
    const validatedData = createAccountPayableSchema.parse(body);

    const supplier = await db.supplier.findFirst({
      where: {
        id: validatedData.supplierId,
        organizationId: organization.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    const amount = validatedData.amount;
    const dueDate = new Date(validatedData.dueDate);

    const payable = await db.accountPayable.create({
      data: {
        organizationId: organization.id,
        supplierId: validatedData.supplierId,
        documentType: validatedData.documentType,
        documentNumber: validatedData.documentNumber,
        issueDate: new Date(validatedData.issueDate),
        dueDate,
        amount,
        balance: amount,
        status: getPayableStatus(dueDate, amount),
        description: validatedData.description,
        notes: validatedData.notes,
        createdBy: session.user.id,
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
      action: 'CREATE_ACCOUNT_PAYABLE',
      resource: 'AccountPayable',
      resourceId: payable.id,
      changes: {
        supplierId: payable.supplierId,
        amount: Number(payable.amount),
        dueDate: payable.dueDate.toISOString(),
      },
    });

    return NextResponse.json({ payable }, { status: 201 });
  } catch (error) {
    console.error('Error al crear cuenta por pagar:', error);
    return NextResponse.json(
      { error: 'Error al crear cuenta por pagar' },
      { status: 500 }
    );
  }
}
