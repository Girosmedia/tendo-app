import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getOrganizationId } from "@/lib/organization";
import { ensureUniqueSKU } from "@/lib/utils/generate-sku";

/**
 * GET /api/products/generate-sku
 * Genera un SKU único para la organización
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

    const sku = await ensureUniqueSKU(organizationId);

    return NextResponse.json({ sku });
  } catch (error) {
    console.error("Error generating SKU:", error);
    return NextResponse.json(
      { error: "Error al generar SKU" },
      { status: 500 }
    );
  }
}
