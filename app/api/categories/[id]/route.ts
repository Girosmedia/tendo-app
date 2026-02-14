import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getCurrentOrganization, isAdminRole } from '@/lib/organization'
import { z } from 'zod'

const categoryUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
})

/**
 * GET /api/categories/[id]
 * Obtiene una categoría específica
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

    const category = await db.category.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    })

    if (!category) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error al obtener categoría:', error)
    return NextResponse.json(
      { error: 'Error al obtener categoría' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/categories/[id]
 * Actualiza una categoría
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
        { error: 'No tienes permisos para editar categorías' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await req.json()
    const validated = categoryUpdateSchema.parse(body)

    // Verificar que la categoría existe y pertenece a la organización
    const existingCategory = await db.category.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    })

    if (!existingCategory) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    // Prevenir ciclo al asignar padre
    if (validated.parentId) {
      const wouldCreateCycle = await checkCategoryHierarchyCycle(id, validated.parentId)
      if (wouldCreateCycle) {
        return NextResponse.json(
          { error: 'No se puede crear una jerarquía circular' },
          { status: 400 }
        )
      }
    }

    const category = await db.category.update({
      where: { id },
      data: {
        name: validated.name,
        description: validated.description,
        parentId: validated.parentId,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error al actualizar categoría:', error)
    return NextResponse.json(
      { error: 'Error al actualizar categoría' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/categories/[id]
 * Elimina una categoría
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
        { error: 'No tienes permisos para eliminar categorías' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verificar que la categoría existe
    const category = await db.category.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
      include: {
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    })

    if (!category) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    // No permitir eliminar si tiene productos o subcategorías
    if (category._count.products > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar una categoría con productos asociados' },
        { status: 400 }
      )
    }

    if (category._count.children > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar una categoría con subcategorías' },
        { status: 400 }
      )
    }

    await db.category.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al eliminar categoría:', error)
    return NextResponse.json(
      { error: 'Error al eliminar categoría' },
      { status: 500 }
    )
  }
}

/**
 * Helper para detectar ciclos en la jerarquía de categorías
 */
async function checkCategoryHierarchyCycle(
  categoryId: string,
  newParentId: string
): Promise<boolean> {
  if (categoryId === newParentId) {
    return true
  }

  let currentParentId: string | null = newParentId
  const visitedIds = new Set<string>([categoryId])

  while (currentParentId) {
    if (visitedIds.has(currentParentId)) {
      return true
    }

    visitedIds.add(currentParentId)

    const parent: { parentId: string | null } | null = await db.category.findUnique({
      where: { id: currentParentId },
      select: { parentId: true },
    })

    currentParentId = parent?.parentId || null
  }

  return false
}
