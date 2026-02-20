import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { createSupportTicketSchema } from '@/lib/validators/support';
import { sendSupportTicketNotificationEmail } from '@/lib/email';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    const tickets = await db.supportTicket.findMany({
      where: { organizationId: organization.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        subject: true,
        status: true,
        priority: true,
        category: true,
        adminReply: true,
        createdAt: true,
        updatedAt: true,
        resolvedAt: true,
      },
      take: 100,
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Error listing support tickets:', error);
    return NextResponse.json({ error: 'Error al listar tickets de soporte' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const validated = createSupportTicketSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const ticket = await db.supportTicket.create({
      data: {
        organizationId: organization.id,
        createdBy: session.user.id,
        subject: validated.data.subject,
        message: validated.data.message,
        priority: validated.data.priority,
        category: validated.data.category || null,
      },
      select: {
        id: true,
        subject: true,
        status: true,
        priority: true,
        category: true,
        createdAt: true,
      },
    });

    try {
      await sendSupportTicketNotificationEmail({
        ticketId: ticket.id,
        organizationName: organization.name,
        reporterName: session.user.name,
        reporterEmail: session.user.email,
        subject: validated.data.subject,
        message: validated.data.message,
        priority: validated.data.priority,
        category: validated.data.category,
      });
    } catch (emailError) {
      console.error('Error sending support ticket notification email:', emailError);
    }

    return NextResponse.json({ message: 'Ticket creado exitosamente', ticket }, { status: 201 });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json({ error: 'Error al crear ticket de soporte' }, { status: 500 });
  }
}
