import { NextRequest, NextResponse } from 'next/server';
import { pdf } from '@react-pdf/renderer';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { buildQuotePdfDocument } from '@/lib/utils/generate-quote-pdf';

export const runtime = 'nodejs';

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
          select: {
            id: true,
            name: true,
            description: true,
            quantity: true,
            unit: true,
            unitPrice: true,
            discount: true,
            total: true,
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

    const pdfStream = await pdf(
      buildQuotePdfDocument({
        quoteId: quote.id,
        docNumber: quote.docNumber,
        docPrefix: quote.docPrefix,
        issuedAt: quote.issuedAt.toISOString(),
        dueAt: quote.dueAt ? quote.dueAt.toISOString() : null,
        notes: quote.notes,
        subtotal: Number(quote.subtotal),
        taxAmount: Number(quote.taxAmount),
        discount: Number(quote.discount),
        total: Number(quote.total),
        customer: quote.customer
          ? {
              name: quote.customer.name,
              rut: quote.customer.rut,
              email: quote.customer.email,
              phone: quote.customer.phone,
              company: quote.customer.company,
            }
          : null,
        organization: {
          name: organization.settings?.businessName || organization.name,
          rut: organization.settings?.rut || organization.rut,
          address: organization.settings?.address || null,
          city: organization.settings?.city || null,
          region: organization.settings?.region || null,
          email: organization.settings?.email || null,
          phone: organization.settings?.phone || null,
        },
        items: quote.items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit,
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount),
          total: Number(item.total),
        })),
      })
    ).toBuffer();

    const chunks: Uint8Array[] = [];
    for await (const chunk of pdfStream as AsyncIterable<Uint8Array | string>) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const pdfBuffer = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
    const fileName = `${quote.docPrefix || 'COT'}-${quote.docNumber}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('Error generating quote PDF:', error);
    return NextResponse.json(
      { error: 'Error al generar PDF de cotización' },
      { status: 500 }
    );
  }
}