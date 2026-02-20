import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!session.user.isSuperAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const tickets = await db.supportTicket.findMany({
      where: {
        ...(status ? { status: status as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' } : {}),
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        subject: true,
        message: true,
        status: true,
        priority: true,
        category: true,
        adminReply: true,
        createdAt: true,
        updatedAt: true,
        resolvedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            rut: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      take: 300,
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Error listing admin support tickets:', error);
    return NextResponse.json({ error: 'Error al listar tickets' }, { status: 500 });
  }
}
