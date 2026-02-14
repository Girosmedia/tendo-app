import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { normalizeSKU } from '@/lib/utils/sku-helpers';

export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sku = searchParams.get('sku');

    if (!sku) {
      return NextResponse.json(
        { error: 'SKU es requerido' },
        { status: 400 }
      );
    }

    // Normalizar SKU (remover espacios, guiones, mayúsculas)
    const normalizedSKU = normalizeSKU(sku);

    // Buscar producto por SKU en la organización
    const product = await db.product.findFirst({
      where: {
        organizationId: session.user.organizationId,
        sku: normalizedSKU,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { 
          found: false,
          sku: normalizedSKU,
        },
        { status: 200 }
      );
    }

    // Convertir Decimals a números
    const productData = {
      ...product,
      price: Number(product.price),
      cost: product.cost ? Number(product.cost) : null,
      taxRate: Number(product.taxRate),
    };

    return NextResponse.json({
      found: true,
      product: productData,
    });

  } catch (error) {
    console.error('Error searching product by SKU:', error);
    return NextResponse.json(
      { error: 'Error al buscar producto' },
      { status: 500 }
    );
  }
}
