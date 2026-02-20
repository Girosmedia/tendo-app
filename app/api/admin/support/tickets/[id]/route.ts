import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { updateSupportTicketSchema } from '@/lib/validators/support';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!session.user.isSuperAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const validated = updateSupportTicketSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const currentTicket = await db.supportTicket.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!currentTicket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    const nextStatus = validated.data.status ?? currentTicket.status;

    const ticket = await db.supportTicket.update({
      where: { id },
      data: {
        ...(validated.data.status && { status: validated.data.status }),
        ...(validated.data.priority && { priority: validated.data.priority }),
        ...(validated.data.adminReply !== undefined && { adminReply: validated.data.adminReply }),
        resolvedAt: nextStatus === 'RESOLVED' || nextStatus === 'CLOSED' ? new Date() : null,
      },
      select: {
        id: true,
        status: true,
        priority: true,
        adminReply: true,
        resolvedAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ message: 'Ticket actualizado', ticket });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    return NextResponse.json({ error: 'Error al actualizar ticket' }, { status: 500 });
  }
}
