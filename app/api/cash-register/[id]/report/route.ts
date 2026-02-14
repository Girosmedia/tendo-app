import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';

/**
 * GET /api/cash-register/[id]/report
 * Obtener datos completos para generar reporte Z
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    const { id } = await params;

    // Obtener la caja
    const cashRegister = await db.cashRegister.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!cashRegister) {
      return NextResponse.json({ error: 'Caja no encontrada' }, { status: 404 });
    }

    // Solo permitir generar reporte de cajas cerradas
    if (cashRegister.status !== 'CLOSED') {
      return NextResponse.json(
        { error: 'No se puede generar reporte de una caja abierta' },
        { status: 400 }
      );
    }

    // Obtener todas las ventas del turno
    const sales = await db.document.findMany({
      where: {
        organizationId: organization.id,
        createdBy: cashRegister.openedBy,
        status: 'PAID',
        type: 'SALE',
        issuedAt: {
          gte: cashRegister.openedAt,
          lte: cashRegister.closedAt!,
        },
      },
      include: {
        customer: {
          select: {
            name: true,
            rut: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: { issuedAt: 'asc' },
    });

    // Calcular distribución de métodos de pago
    const paymentSummary: Record<string, { count: number; total: number }> = {};
    
    for (const sale of sales) {
      const method = sale.paymentMethod;
      if (!paymentSummary[method]) {
        paymentSummary[method] = { count: 0, total: 0 };
      }
      paymentSummary[method].count += 1;
      paymentSummary[method].total += Number(sale.total);
    }

    // Obtener top 5 productos del turno
    const topProductsData = await db.documentItem.groupBy({
      by: ['productId'],
      where: {
        document: {
          organizationId: organization.id,
          createdBy: cashRegister.openedBy,
          status: 'PAID',
          type: 'SALE',
          issuedAt: {
            gte: cashRegister.openedAt,
            lte: cashRegister.closedAt!,
          },
        },
        productId: { not: null },
      },
      _sum: {
        quantity: true,
        total: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    // Enriquecer datos de productos
    const productIds = topProductsData
      .map((item: any) => item.productId)
      .filter((id: any): id is string => id !== null);

    const products = await db.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        name: true,
        sku: true,
      },
    });

    const productMap = new Map(products.map((p: any) => [p.id, p]));

    const topProducts = topProductsData.map((item: any) => {
      const product: any = item.productId ? productMap.get(item.productId) : null;
      return {
        productId: item.productId,
        productName: product?.name || 'Producto sin nombre',
        sku: product?.sku || '',
        quantity: Number(item._sum.quantity || 0),
        revenue: Number(item._sum.total || 0),
      };
    });

    // Formatear ventas para el reporte
    const formattedSales = sales.map((sale: any) => ({
      id: sale.id,
      documentNumber: sale.docNumber,
      customerName: sale.customer?.name || 'Público general',
      customerRut: sale.customer?.rut || '',
      paymentMethod: sale.paymentMethod,
      total: Number(sale.total),
      issuedAt: sale.issuedAt.toISOString(),
      items: sale.items.map((item: any) => ({
        name: item.product?.name || item.name,
        sku: item.product?.sku || item.sku,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
    }));

    // Preparar respuesta
    return NextResponse.json({
      cashRegister: {
        id: cashRegister.id,
        openedAt: cashRegister.openedAt.toISOString(),
        closedAt: cashRegister.closedAt!.toISOString(),
        openedBy: cashRegister.openedBy,
        closedBy: cashRegister.closedBy,
        openingCash: Number(cashRegister.openingCash),
        expectedCash: Number(cashRegister.expectedCash),
        actualCash: Number(cashRegister.actualCash!),
        difference: Number(cashRegister.difference!),
        totalSales: Number(cashRegister.totalSales),
        salesCount: cashRegister.salesCount,
        notes: cashRegister.notes,
      },
      sales: formattedSales,
      paymentSummary,
      topProducts,
      organization: {
        name: organization.name,
        rut: organization.rut,
      },
    });
  } catch (error) {
    console.error('Error al obtener datos de reporte Z:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos del reporte' },
      { status: 500 }
    );
  }
}
