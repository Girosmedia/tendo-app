import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getCurrentOrganization, isAdminRole } from '@/lib/organization'
import { z } from 'zod'
import { Prisma } from '@/lib/generated/prisma/client/client'
import { productUpdateApiSchema } from '@/lib/validators/product'

/**
 * GET /api/products/[id]
 * Obtiene un producto específico
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const organization = await getCurrentOrganization()
    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 })
    }

    const { id } = await params

    const product = await db.product.findFirst({
      where: {
        id,
        organizationId: organization.id,
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

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error al obtener producto:', error)
    return NextResponse.json(
      { error: 'Error al obtener producto' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/products/[id]
 * Actualiza un producto
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const organization = await getCurrentOrganization()
    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 })
    }

    if (!isAdminRole(organization.userRole)) {
      return NextResponse.json(
        { error: 'No tienes permisos para editar productos' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await req.json()
    const validated = productUpdateApiSchema.parse(body)

    // Verificar que el producto existe
    const existingProduct = await db.product.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // Verificar SKU único si se está cambiando
    if (validated.sku && validated.sku !== existingProduct.sku) {
      const skuExists = await db.product.findFirst({
        where: {
          organizationId: organization.id,
          sku: validated.sku,
          id: { not: id },
        },
      })

      if (skuExists) {
        return NextResponse.json(
          { error: 'El SKU ya existe en esta organización' },
          { status: 400 }
        )
      }
    }

    // Verificar categoría si se proporciona (y no es null)
    if (validated.categoryId !== null && validated.categoryId !== undefined) {
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

    // Si cambia a SERVICE, desactivar trackInventory
    const type = validated.type || existingProduct.type
    const trackInventory = type === 'SERVICE' ? false : (validated.trackInventory ?? existingProduct.trackInventory)

    const updateData: any = {
      type: validated.type,
      categoryId: validated.categoryId,
      sku: validated.sku,
      name: validated.name,
      description: validated.description,
      imageUrl: validated.imageUrl,
      trackInventory,
      unit: validated.unit,
      isActive: validated.isActive,
    }

    if (validated.price !== undefined) {
      updateData.price = new Prisma.Decimal(validated.price)
    }
    if (validated.cost !== undefined) {
      updateData.cost = validated.cost !== null ? new Prisma.Decimal(validated.cost) : null
    }
    if (validated.taxRate !== undefined) {
      updateData.taxRate = new Prisma.Decimal(validated.taxRate)
    }
    if (validated.currentStock !== undefined && trackInventory) {
      updateData.currentStock = validated.currentStock
    }
    if (validated.minStock !== undefined && trackInventory) {
      updateData.minStock = validated.minStock
    }

    // Limpiar undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    const product = await db.product.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ product })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error al actualizar producto:', error)
    return NextResponse.json(
      { error: 'Error al actualizar producto' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/products/[id]
 * Elimina un producto
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const organization = await getCurrentOrganization()
    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 })
    }

    if (!isAdminRole(organization.userRole)) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar productos' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verificar que el producto existe
    const product = await db.product.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // TODO: Verificar que no tenga documentos asociados cuando se implemente el módulo de documentos

    await db.product.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al eliminar producto:', error)
    return NextResponse.json(
      { error: 'Error al eliminar producto' },
      { status: 500 }
    )
  }
}
