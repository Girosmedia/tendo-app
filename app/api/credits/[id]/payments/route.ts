import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  createPaymentSchema,
  validatePaymentAmount,
} from "@/lib/validators/credit";
import { logAudit } from "@/lib/audit";
import { getOrganizationId } from "@/lib/organization";
import type { Prisma } from "@/lib/generated/prisma/client/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/credits/[id]/payments
 * Registra un pago a un crédito específico
 */
export async function POST(req: NextRequest, context: RouteContext) {
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

    const { id: creditId } = await context.params;

    const body = await req.json();
    const validated = createPaymentSchema.safeParse({
      ...body,
      creditId,
    });

    if (!validated.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { amount, paymentMethod, reference, notes, paidAt } = validated.data;

    // Verificar que el crédito existe y pertenece a la organización
    const credit = await prisma.credit.findFirst({
      where: {
        id: creditId,
        organizationId,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!credit) {
      return NextResponse.json(
        { error: "Crédito no encontrado" },
        { status: 404 }
      );
    }

    // Validar que el crédito está activo
    if (credit.status !== "ACTIVE" && credit.status !== "OVERDUE") {
      return NextResponse.json(
        { error: "El crédito no está activo" },
        { status: 400 }
      );
    }

    // Validar que el monto del pago no exceda el saldo
    const currentBalance = Number(credit.balance);
    if (!validatePaymentAmount(amount, currentBalance)) {
      return NextResponse.json(
        {
          error: `El monto del pago ($${amount.toLocaleString("es-CL")}) excede el saldo pendiente ($${currentBalance.toLocaleString("es-CL")})`,
        },
        { status: 400 }
      );
    }

    // Calcular nuevo saldo
    const newBalance = currentBalance - amount;
    const isPaid = newBalance === 0;

    // Registrar el pago y actualizar el crédito en una transacción
    const payment = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Crear el pago
      const newPayment = await tx.payment.create({
        data: {
          organizationId,
          creditId,
          customerId: credit.customerId,
          amount,
          paymentMethod,
          reference: reference || null,
          notes: notes || null,
          paidAt: paidAt || new Date(),
        },
      });

      // Actualizar el saldo del crédito
      await tx.credit.update({
        where: { id: creditId },
        data: {
          balance: newBalance,
          status: isPaid ? "PAID" : credit.status,
        },
      });

      // Actualizar la deuda del cliente
      await tx.customer.update({
        where: { id: credit.customerId },
        data: {
          currentDebt: {
            decrement: amount,
          },
        },
      });

      return newPayment;
    });

    // Registrar en auditoría
    await logAudit({
      userId: session.user.id,
      organizationId,
      action: "CREATE",
      resource: "PAYMENT",
      resourceId: payment.id,
      details: {
        creditId,
        customerId: credit.customerId,
        customerName: credit.customer.name,
        amount,
        paymentMethod,
        newBalance,
        isPaid,
      },
    });

    // Obtener el crédito actualizado con todos sus datos
    const updatedCredit = await prisma.credit.findUnique({
      where: { id: creditId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            rut: true,
            currentDebt: true,
          },
        },
        payments: {
          orderBy: { paidAt: "desc" },
        },
      },
    });

    return NextResponse.json(
      {
        payment,
        credit: updatedCredit,
        message: isPaid
          ? "Pago registrado. Crédito totalmente pagado."
          : `Pago registrado. Saldo pendiente: $${newBalance.toLocaleString("es-CL")}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Error al registrar pago" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/credits/[id]/payments
 * Obtiene todos los pagos de un crédito
 */
export async function GET(req: NextRequest, context: RouteContext) {
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

    const { id: creditId } = await context.params;

    // Verificar que el crédito existe y pertenece a la organización
    const credit = await prisma.credit.findFirst({
      where: {
        id: creditId,
        organizationId,
      },
    });

    if (!credit) {
      return NextResponse.json(
        { error: "Crédito no encontrado" },
        { status: 404 }
      );
    }

    const payments = await prisma.payment.findMany({
      where: {
        creditId,
        organizationId,
      },
      orderBy: { paidAt: "desc" },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Error al obtener pagos" },
      { status: 500 }
    );
  }
}
