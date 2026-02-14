import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { paymentQuerySchema } from "@/lib/validators/credit";
import { getOrganizationId } from "@/lib/organization";

/**
 * GET /api/payments
 * Obtiene todos los pagos de la organización con filtros opcionales
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
    const queryParams = paymentQuerySchema.safeParse({
      customerId: searchParams.get("customerId") || undefined,
      creditId: searchParams.get("creditId") || undefined,
      paymentMethod: searchParams.get("paymentMethod") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    });

    if (!queryParams.success) {
      return NextResponse.json(
        { error: "Parámetros inválidos", details: queryParams.error.flatten() },
        { status: 400 }
      );
    }

    const { customerId, creditId, paymentMethod, startDate, endDate } =
      queryParams.data;

    // Build where clause
    const where: any = { organizationId };

    if (customerId) {
      where.customerId = customerId;
    }

    if (creditId) {
      where.creditId = creditId;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      where.paidAt = {};
      if (startDate) {
        where.paidAt.gte = startDate;
      }
      if (endDate) {
        where.paidAt.lte = endDate;
      }
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            rut: true,
          },
        },
        credit: {
          select: {
            id: true,
            amount: true,
            balance: true,
            status: true,
            dueDate: true,
          },
        },
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
