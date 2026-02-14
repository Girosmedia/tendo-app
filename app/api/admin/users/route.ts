import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Verificar autenticación y permisos de super admin
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (!session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'No autorizado. Se requieren permisos de administrador' },
        { status: 403 }
      );
    }

    // Obtener todos los usuarios con sus membresías
    const users = await db.user.findMany({
      include: {
        memberships: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            memberships: true,
            sessions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transformar datos para la respuesta (sin password)
    const usersData = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      isSuperAdmin: user.isSuperAdmin,
      currentOrganizationId: user.currentOrganizationId,
      organizations: user.memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role,
      })),
      membershipCount: user._count.memberships,
      sessionCount: user._count.sessions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return NextResponse.json({
      users: usersData,
      total: usersData.length,
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
