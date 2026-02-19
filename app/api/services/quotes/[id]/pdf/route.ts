import { NextRequest, NextResponse } from 'next/server';
import { pdf } from '@react-pdf/renderer';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';
import { buildQuotePdfDocument } from '@/lib/utils/generate-quote-pdf';

export const runtime = 'nodejs';

function resolveLogoUrl(logoUrl: string | null | undefined, origin: string) {
  if (!logoUrl) return null;

  if (/^https?:\/\//i.test(logoUrl) || logoUrl.startsWith('data:')) {
    return logoUrl;
  }

  try {
    return new URL(logoUrl, origin).toString();
  } catch {
    return null;
  }
}

async function resolveLogoForPdf(
  logoUrl: string | null | undefined,
  origin: string,
  requestCookie: string | null,
  context?: { quoteId?: string; organizationId?: string }
) {
  const resolvedUrl = resolveLogoUrl(logoUrl, origin);
  const logPrefix = `[Quote PDF][Logo] quote=${context?.quoteId || 'n/a'} org=${context?.organizationId || 'n/a'}`;

  console.log(`${logPrefix} input=`, {
    rawLogoUrl: logoUrl,
    resolvedLogoUrl: resolvedUrl,
  });

  if (!resolvedUrl) return null;

  if (resolvedUrl.startsWith('data:')) {
    console.log(`${logPrefix} using pre-embedded data URI`);
    return resolvedUrl;
  }

  try {
    const logoUrlObject = new URL(resolvedUrl);
    const sameOrigin = logoUrlObject.origin === origin;

    console.log(`${logPrefix} fetching logo`, {
      sameOrigin,
      host: logoUrlObject.host,
      pathname: logoUrlObject.pathname,
    });

    const response = await fetch(resolvedUrl, {
      headers:
        sameOrigin && requestCookie
          ? {
              cookie: requestCookie,
            }
          : undefined,
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn(`${logPrefix} fetch failed`, {
        status: response.status,
        statusText: response.statusText,
      });
      return resolvedUrl;
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    console.log(`${logPrefix} fetch ok`, {
      contentType,
      contentLength: response.headers.get('content-length') || 'unknown',
    });

    if (!contentType.startsWith('image/')) {
      console.warn(`${logPrefix} invalid content-type for logo`, { contentType });
      return resolvedUrl;
    }

    if (contentType.includes('svg')) {
      const svgText = await response.text();

      if (!svgText.trim()) {
        console.warn(`${logPrefix} empty svg payload`);
        return resolvedUrl;
      }

      try {
        const sharpModule = await import('sharp');
        const sharp = sharpModule.default;

        const pngData = await sharp(Buffer.from(svgText, 'utf8'))
          .png({ quality: 100 })
          .toBuffer();

        const pngBase64 = pngData.toString('base64');

        console.log(`${logPrefix} svg converted to png`, {
          svgChars: svgText.length,
          pngBytes: pngData.byteLength,
        });

        return `data:image/png;base64,${pngBase64}`;
      } catch (svgError) {
        console.error(`${logPrefix} svg conversion failed`, svgError);
        console.warn(`${logPrefix} svg logo omitted due conversion error`);
        return null;
      }
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    console.log(`${logPrefix} raster image embedded as base64`, {
      bytes: arrayBuffer.byteLength,
    });

    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error(`${logPrefix} unexpected error resolving logo`, error);
    return resolvedUrl;
  }
}

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

    const logoForPdf = await resolveLogoForPdf(
      organization.settings?.logoUrl || organization.logoUrl,
      req.nextUrl.origin,
      req.headers.get('cookie'),
      {
        quoteId: quote.id,
        organizationId: organization.id,
      }
    );

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
          logoUrl: logoForPdf,
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