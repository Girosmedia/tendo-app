import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getCurrentOrganization, isAdminRole } from '@/lib/organization'
import { z } from 'zod'

const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().optional(),
  parentId: z.string().optional(),
})

/**
 * GET /api/categories
 * Lista todas las categorías de la organización actual
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

    const categories = await db.category.findMany({
      where: { organizationId: organization.id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error al listar categorías:', error)
    return NextResponse.json(
      { error: 'Error al listar categorías' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/categories
 * Crea una nueva categoría
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

    if (!isAdminRole(organization.userRole)) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear categorías' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validated = categorySchema.parse(body)

    // Generar slug único
    const baseSlug = validated.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    let slug = baseSlug
    let counter = 1

    // Verificar que el slug sea único en la organización
    while (
      await db.category.findFirst({
        where: {
          organizationId: organization.id,
          slug,
        },
      })
    ) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const category = await db.category.create({
      data: {
        organizationId: organization.id,
        name: validated.name,
        slug,
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

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error al crear categoría:', error)
    return NextResponse.json(
      { error: 'Error al crear categoría' },
      { status: 500 }
    )
  }
}
