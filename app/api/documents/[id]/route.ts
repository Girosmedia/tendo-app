import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { logAuditAction } from '@/lib/audit';
import { updateDocumentSchema } from '@/lib/validators/document';

// GET /api/documents/[id] - Obtener documento por ID
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

    const document = await db.document.findFirst({
      where: {
        id,
        organizationId: organization.id,
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
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                imageUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Error al obtener documento' },
      { status: 500 }
    );
  }
}

// PATCH /api/documents/[id] - Actualizar documento
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

    // Verificar que el documento exista y pertenezca a la organización
    const existingDocument = await db.document.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!existingDocument) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    // Solo se pueden editar documentos en estado DRAFT o PENDING
    if (!['DRAFT', 'PENDING'].includes(existingDocument.status)) {
      return NextResponse.json(
        {
          error: `No se puede editar un documento en estado ${existingDocument.status}`,
        },
        { status: 400 }
      );
    }

    const json = await req.json();
    const validatedData = updateDocumentSchema.parse(json);

    // Preparar datos de actualización
    const updateData: any = {
      ...validatedData,
    };

    // Convertir fechas si existen
    if (validatedData.dueAt) {
      updateData.dueAt = new Date(validatedData.dueAt);
    }
    if (validatedData.paidAt) {
      updateData.paidAt = new Date(validatedData.paidAt);
    }

    // Convertir a Decimal si existen
    if (validatedData.discount !== undefined) {
      updateData.discount = validatedData.discount;
      
      // Recalcular total si cambia el descuento
      const newTotal = Number(existingDocument.subtotal) +
        Number(existingDocument.taxAmount) -
        updateData.discount;
      updateData.total = newTotal;
    }

    if (validatedData.cashReceived !== undefined && validatedData.cashReceived !== null) {
      updateData.cashReceived = validatedData.cashReceived;
      
      // Recalcular vuelto
      const total = updateData.total || Number(existingDocument.total);
      updateData.cashChange = validatedData.cashReceived - total;
    }

    // Actualizar documento
    const document = await db.document.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Audit log
    await logAuditAction({
      userId: session.user.id,
      action: 'UPDATE_DOCUMENT',
      resource: 'Document',
      resourceId: document.id,
      changes: validatedData,
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error updating document:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar documento' },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id] - Cancelar/Anular documento
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

    // Verificar que el documento exista
    const document = await db.document.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
      include: {
        items: {
          where: {
            productId: { not: null },
          },
          select: {
            productId: true,
            quantity: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    // No se pueden cancelar documentos ya cancelados
    if (document.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'El documento ya está cancelado' },
        { status: 400 }
      );
    }

    // Si el documento estaba pagado, restaurar stock
    if (document.status === 'PAID' && document.type === 'SALE') {
      for (const item of document.items) {
        if (item.productId) {
          const product = await db.product.findUnique({
            where: { id: item.productId },
            select: { trackInventory: true },
          });

          if (product?.trackInventory) {
            await db.product.update({
              where: { id: item.productId },
              data: {
                currentStock: {
                  increment: Math.floor(Number(item.quantity)),
                },
              },
            });
          }
        }
      }
    }

    // Marcar como cancelado (no eliminamos, solo cambiamos estado)
    const cancelledDocument = await db.document.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });

    // Audit log
    await logAuditAction({
      userId: session.user.id,
      action: 'CANCEL_DOCUMENT',
      resource: 'Document',
      resourceId: document.id,
      changes: {
        previousStatus: document.status,
        newStatus: 'CANCELLED',
      },
    });

    return NextResponse.json({
      message: 'Documento cancelado exitosamente',
      document: cancelledDocument,
    });
  } catch (error) {
    console.error('Error cancelling document:', error);
    return NextResponse.json(
      { error: 'Error al cancelar documento' },
      { status: 500 }
    );
  }
}
