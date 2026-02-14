import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  createCreditSchema,
  creditQuerySchema,
  validateCreditLimit,
} from "@/lib/validators/credit";
import { logAudit } from "@/lib/audit";
import { getOrganizationId } from "@/lib/organization";

/**
 * GET /api/credits
 * Obtiene todos los créditos de la organización con filtros opcionales
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const organizationId = await getOrganizationId(session.user.id);
    if (!organizationId) {
      return NextResponse.json(
        { error: "Usuario sin organización" },
        { status: 403 }
      );
    }

    // Parse query params
    const searchParams = req.nextUrl.searchParams;
    const queryParams = creditQuerySchema.safeParse({
      customerId: searchParams.get("customerId") || undefined,
      status: searchParams.get("status") || undefined,
      overdue: searchParams.get("overdue") || undefined,
    });

    if (!queryParams.success) {
      return NextResponse.json(
        { error: "Parámetros inválidos", details: queryParams.error.flatten() },
        { status: 400 }
      );
    }

    const { customerId, status, overdue } = queryParams.data;

    // Build where clause
    const where: any = { organizationId };

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    if (overdue) {
      where.status = "ACTIVE";
      where.dueDate = { lt: new Date() };
    }

    const credits = await prisma.credit.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            rut: true,
            email: true,
            phone: true,
            currentDebt: true,
            creditLimit: true,
          },
        },
        document: {
          select: {
            id: true,
            type: true,
            docNumber: true,
            docPrefix: true,
            total: true,
            issuedAt: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            paidAt: true,
          },
          orderBy: { paidAt: "desc" },
        },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    });

    return NextResponse.json({ credits });
  } catch (error) {
    console.error("Error fetching credits:", error);
    return NextResponse.json(
      { error: "Error al obtener créditos" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/credits
 * Crea un nuevo crédito para un cliente
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const organizationId = await getOrganizationId(session.user.id);
    if (!organizationId) {
      return NextResponse.json(
        { error: "Usuario sin organización" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = createCreditSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { customerId, documentId, amount, dueDate, description, notes } =
      validated.data;

    // Verificar que el cliente pertenece a la organización
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        organizationId,
      },
      select: {
        id: true,
        name: true,
        currentDebt: true,
        creditLimit: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // Validar límite de crédito
    const limitValidation = validateCreditLimit(
      Number(customer.currentDebt),
      amount,
      customer.creditLimit ? Number(customer.creditLimit) : null
    );

    if (!limitValidation.valid) {
      return NextResponse.json(
        { error: limitValidation.message },
        { status: 400 }
      );
    }

    // Si se proporciona documentId, verificar que existe y pertenece a la org
    if (documentId) {
      const document = await prisma.document.findFirst({
        where: {
          id: documentId,
          organizationId,
        },
      });

      if (!document) {
        return NextResponse.json(
          { error: "Documento no encontrado" },
          { status: 404 }
        );
      }
    }

    // Crear crédito y actualizar deuda del cliente en una transacción
    const credit = await prisma.$transaction(async (tx: any) => {
      const newCredit = await tx.credit.create({
        data: {
          organizationId,
          customerId,
          documentId: documentId || null,
          amount,
          balance: amount,
          dueDate,
          description: description || null,
          notes: notes || null,
          status: "ACTIVE",
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              rut: true,
              currentDebt: true,
              creditLimit: true,
            },
          },
          document: {
            select: {
              id: true,
              type: true,
              docNumber: true,
              total: true,
            },
          },
        },
      });

      // Actualizar deuda del cliente
      await tx.customer.update({
        where: { id: customerId },
        data: {
          currentDebt: {
            increment: amount,
          },
        },
      });

      return newCredit;
    });

    // Registrar en auditoría
    await logAudit({
      userId: session.user.id,
      organizationId,
      action: "CREATE",
      resource: "CREDIT",
      resourceId: credit.id,
      details: {
        customerId,
        customerName: customer.name,
        amount,
        dueDate: dueDate.toISOString(),
      },
    });

    return NextResponse.json({ credit }, { status: 201 });
  } catch (error) {
    console.error("Error creating credit:", error);
    return NextResponse.json(
      { error: "Error al crear crédito" },
      { status: 500 }
    );
  }
}
