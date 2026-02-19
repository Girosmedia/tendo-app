import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { logAuditAction } from '@/lib/audit';
import { sendQuoteApprovedCustomerEmail } from '@/lib/email';
import { updateQuoteSchema } from '@/lib/validators/document';
import { z } from 'zod';

// GET /api/services/quotes/[id] - Obtener cotización por ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 404 }
      );
    }

    const { id } = await params;

    const quote = await db.document.findFirst({
      where: {
        id,
        organizationId: organization.id,
        type: 'QUOTE',
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            rut: true,
            email: true,
            phone: true,
            company: true,
          },
        },
        items: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ quote });
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { error: 'Error al obtener cotización' },
      { status: 500 }
    );
  }
}

// PATCH /api/services/quotes/[id] - Actualizar estado/datos de cotización
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 404 }
      );
    }

    const { id } = await params;

    const existingQuote = await db.document.findFirst({
      where: {
        id,
        organizationId: organization.id,
        type: 'QUOTE',
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existingQuote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = updateQuoteSchema.parse(body);

    const updatedQuote = await db.document.update({
      where: { id },
      data: {
        ...(validatedData.customerId !== undefined && {
          customerId: validatedData.customerId,
        }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.dueAt !== undefined && {
          dueAt: validatedData.dueAt ? new Date(validatedData.dueAt) : null,
        }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            rut: true,
            email: true,
            company: true,
          },
        },
        items: true,
      },
    });

    const quoteWasJustApproved =
      existingQuote.status !== 'APPROVED' && updatedQuote.status === 'APPROVED';

    if (quoteWasJustApproved && updatedQuote.customer?.email) {
      const quoteCode = `${updatedQuote.docPrefix || 'COT'}-${updatedQuote.docNumber}`;

      try {
        await sendQuoteApprovedCustomerEmail({
          toEmail: updatedQuote.customer.email,
          customerName: updatedQuote.customer.name,
          organizationName: organization.settings?.businessName || organization.name,
          organizationLogoUrl: organization.settings?.logoUrl || organization.logoUrl,
          quoteCode,
          total: Number(updatedQuote.total),
          organizationEmail: organization.settings?.email || null,
          organizationPhone: organization.settings?.phone || null,
        });
      } catch (emailError) {
        console.error('Error sending quote approval confirmation email:', {
          quoteId: updatedQuote.id,
          customerEmail: updatedQuote.customer.email,
          error: emailError,
        });
      }
    }

    await logAuditAction({
      userId: session.user.id,
      action: 'UPDATE_QUOTE',
      resource: 'Document',
      resourceId: updatedQuote.id,
      changes: {
        before: { status: existingQuote.status },
        after: { status: updatedQuote.status },
        payload: validatedData,
      },
    });

    return NextResponse.json({ quote: updatedQuote });
  } catch (error) {
    console.error('Error updating quote:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar cotización' },
      { status: 500 }
    );
  }
}

// DELETE /api/services/quotes/[id] - Cancelar cotización
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 404 }
      );
    }

    const { id } = await params;

    const quote = await db.document.findFirst({
      where: {
        id,
        organizationId: organization.id,
        type: 'QUOTE',
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      );
    }

    if (quote.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'La cotización ya está cancelada' },
        { status: 400 }
      );
    }

    const cancelledQuote = await db.document.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'CANCEL_QUOTE',
      resource: 'Document',
      resourceId: cancelledQuote.id,
      changes: {
        previousStatus: quote.status,
        newStatus: 'CANCELLED',
      },
    });

    return NextResponse.json({
      message: 'Cotización cancelada exitosamente',
      quote: cancelledQuote,
    });
  } catch (error) {
    console.error('Error cancelling quote:', error);
    return NextResponse.json(
      { error: 'Error al cancelar cotización' },
      { status: 500 }
    );
  }
}
