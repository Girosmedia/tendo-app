import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization, isAdmin } from '@/lib/organization';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const organization = await getCurrentOrganization();

    if (!organization) {
      return NextResponse.json(
        { error: 'No perteneces a ninguna organización' },
        { status: 404 }
      );
    }

    // Obtener todos los miembros de la organización
    const members = await db.member.findMany({
      where: {
        organizationId: organization.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Formatear la respuesta
    const formattedMembers = members.map((member) => ({
      id: member.id,
      userId: member.userId,
      name: member.user.name,
      email: member.user.email,
      image: member.user.image,
      role: member.role,
      isActive: member.isActive,
      joinedAt: member.createdAt,
    }));

    return NextResponse.json({ members: formattedMembers });
  } catch (error) {
    console.error('Error al obtener miembros:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
