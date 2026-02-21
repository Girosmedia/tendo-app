import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getCurrentOrganization, isAdminRole } from '@/lib/organization'
import { z } from 'zod'
import { Prisma } from '@/lib/generated/prisma/client/client'
import { productApiSchema } from '@/lib/validators/product'
import { hasModuleAccess } from '@/lib/entitlements'

/**
 * GET /api/products
 * Lista todos los productos de la organización actual
 */
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const organization = await getCurrentOrganization()
    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 })
    }

    if (!hasModuleAccess({
      organizationPlan: organization.plan,
      subscriptionPlanId: organization.subscription?.planId,
      organizationModules: organization.modules,
    }, 'INVENTORY')) {
      return NextResponse.json({ error: 'Módulo Inventario no habilitado para tu plan' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const categoryId = searchParams.get('categoryId')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')

    const where: any = {
      organizationId: organization.id,
    }

    if (type && (type === 'PRODUCT' || type === 'SERVICE')) {
      where.type = type
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const products = await db.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    console.info(`Productos listados para la organización ${organization.id}: ${products.length} encontrados`)

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error al listar productos:', error)
    return NextResponse.json(
      { error: 'Error al listar productos' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/products
 * Crea un nuevo producto
 */
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const organization = await getCurrentOrganization()
    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 })
    }

    if (!hasModuleAccess({
      organizationPlan: organization.plan,
      subscriptionPlanId: organization.subscription?.planId,
      organizationModules: organization.modules,
    }, 'INVENTORY')) {
      return NextResponse.json({ error: 'Módulo Inventario no habilitado para tu plan' }, { status: 403 })
    }

    if (!isAdminRole(organization.userRole)) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear productos' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validated = productApiSchema.parse(body)

    // Verificar que el SKU sea único en la organización
    const existingSku = await db.product.findFirst({
      where: {
        organizationId: organization.id,
        sku: validated.sku,
      },
    })

    if (existingSku) {
      return NextResponse.json(
        { error: 'El SKU ya existe en esta organización' },
        { status: 400 }
      )
    }

    // Verificar que la categoría existe si se proporciona
    if (validated.categoryId) {
      const category = await db.category.findFirst({
        where: {
          id: validated.categoryId,
          organizationId: organization.id,
        },
      })

      if (!category) {
        return NextResponse.json(
          { error: 'Categoría no encontrada' },
          { status: 404 }
        )
      }
    }

    // Si es SERVICE, no trackear inventario
    const trackInventory = validated.type === 'SERVICE' ? false : validated.trackInventory

    const product = await db.product.create({
      data: {
        organizationId: organization.id,
        type: validated.type,
        categoryId: validated.categoryId || null,
        sku: validated.sku,
        name: validated.name,
        description: validated.description,
        imageUrl: validated.imageUrl === '' ? null : (validated.imageUrl ?? null),
        price: new Prisma.Decimal(validated.price),
        cost: validated.cost !== undefined ? new Prisma.Decimal(validated.cost) : null,
        taxRate: new Prisma.Decimal(validated.taxRate),
        trackInventory,
        currentStock: trackInventory ? validated.currentStock : 0,
        minStock: trackInventory ? validated.minStock : 0,
        unit: validated.unit,
        isActive: validated.isActive,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error al crear producto:', error)
    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 }
    )
  }
}
