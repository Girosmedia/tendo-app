import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { updateCreditSchema } from "@/lib/validators/credit";
import { logAudit } from "@/lib/audit";
import { getOrganizationId } from "@/lib/organization";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/credits/[id]
 * Obtiene un crédito específico con sus pagos
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

    const { id } = await context.params;

    const credit = await prisma.credit.findFirst({
      where: {
        id,
        organizationId,
      },
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
            reference: true,
            notes: true,
            paidAt: true,
          },
          orderBy: { paidAt: "desc" },
        },
      },
    });

    if (!credit) {
      return NextResponse.json(
        { error: "Crédito no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ credit });
  } catch (error) {
    console.error("Error fetching credit:", error);
    return NextResponse.json(
      { error: "Error al obtener crédito" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/credits/[id]
 * Actualiza un crédito existente
 */
export async function PUT(req: NextRequest, context: RouteContext) {
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

    const { id } = await context.params;

    const body = await req.json();
    const validated = updateCreditSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    // Verificar que el crédito existe y pertenece a la organización
    const existingCredit = await prisma.credit.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingCredit) {
      return NextResponse.json(
        { error: "Crédito no encontrado" },
        { status: 404 }
      );
    }

    // Si se está cancelando el crédito con saldo pendiente, restar la deuda del cliente
    let updateData: any = { ...validated.data };

    if (validated.data.status === "CANCELED" && Number(existingCredit.balance) > 0) {
      await prisma.customer.update({
        where: { id: existingCredit.customerId },
        data: {
          currentDebt: {
            decrement: existingCredit.balance,
          },
        },
      });
      updateData.balance = 0;
    }

    const credit = await prisma.credit.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            rut: true,
          },
        },
      },
    });

    // Registrar en auditoría
    await logAudit({
      userId: session.user.id,
      organizationId,
      action: "UPDATE",
      resource: "CREDIT",
      resourceId: credit.id,
      details: {
        changes: validated.data,
      },
    });

    return NextResponse.json({ credit });
  } catch (error) {
    console.error("Error updating credit:", error);
    return NextResponse.json(
      { error: "Error al actualizar crédito" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/credits/[id]
 * Elimina (cancela) un crédito
 * Solo se puede eliminar si no tiene pagos registrados
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
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

    const { id } = await context.params;

    const credit = await prisma.credit.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        payments: true,
      },
    });

    if (!credit) {
      return NextResponse.json(
        { error: "Crédito no encontrado" },
        { status: 404 }
      );
    }

    // No permitir eliminar si tiene pagos
    if (credit.payments.length > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar un crédito con pagos registrados. Cancélalo en su lugar.",
        },
        { status: 400 }
      );
    }

    // Eliminar crédito y actualizar deuda del cliente
    await prisma.$transaction(async (tx: any) => {
      await tx.credit.delete({
        where: { id },
      });

      await tx.customer.update({
        where: { id: credit.customerId },
        data: {
          currentDebt: {
            decrement: credit.balance,
          },
        },
      });
    });

    // Registrar en auditoría
    await logAudit({
      userId: session.user.id,
      organizationId,
      action: "DELETE",
      resource: "CREDIT",
      resourceId: id,
      details: {
        customerId: credit.customerId,
        amount: credit.amount.toString(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting credit:", error);
    return NextResponse.json(
      { error: "Error al eliminar crédito" },
      { status: 500 }
    );
  }
}
