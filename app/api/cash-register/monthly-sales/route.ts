import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Parámetros startDate y endDate son requeridos' },
        { status: 400 }
      );
    }

    const sales = await db.document.findMany({
      where: {
        organizationId: organization.id,
        type: 'SALE',
        status: 'PAID',
        issuedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      select: {
        id: true,
        docNumber: true,
        issuedAt: true,
        paymentMethod: true,
        subtotal: true,
        taxAmount: true,
        discount: true,
        total: true,
        customer: {
          select: {
            name: true,
            rut: true,
          },
        },
      },
      orderBy: {
        issuedAt: 'asc',
      },
    });

    const formattedSales = sales.map((sale) => ({
      id: sale.id,
      documentNumber: sale.docNumber,
      issuedAt: sale.issuedAt.toISOString(),
      paymentMethod: sale.paymentMethod,
      customerName: sale.customer?.name || 'Público general',
      customerRut: sale.customer?.rut || '',
      subtotal: Number(sale.subtotal),
      taxAmount: Number(sale.taxAmount),
      discount: Number(sale.discount),
      total: Number(sale.total),
    }));

    return NextResponse.json({
      sales: formattedSales,
      summary: {
        salesCount: formattedSales.length,
        subtotal: formattedSales.reduce((acc, sale) => acc + sale.subtotal, 0),
        taxAmount: formattedSales.reduce((acc, sale) => acc + sale.taxAmount, 0),
        discount: formattedSales.reduce((acc, sale) => acc + sale.discount, 0),
        total: formattedSales.reduce((acc, sale) => acc + sale.total, 0),
      },
    });
  } catch (error) {
    console.error('Error al obtener detalle mensual de ventas:', error);
    return NextResponse.json(
      { error: 'Error al obtener detalle mensual de ventas' },
      { status: 500 }
    );
  }
}