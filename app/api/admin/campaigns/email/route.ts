import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { AUDIT_ACTIONS, logAuditAction } from '@/lib/audit';
import { sendAdminBroadcastEmail } from '@/lib/email';

const sendCampaignSchema = z.object({
  audience: z.enum(['OWNER', 'ADMIN', 'OWNER_ADMIN']),
  subject: z.string().min(3, 'El asunto debe tener al menos 3 caracteres').max(120, 'El asunto es demasiado largo'),
  message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres').max(5000, 'El mensaje es demasiado largo'),
  isHtml: z.boolean().optional().default(false),
});

const audienceRoleMap = {
  OWNER: ['OWNER'] as const,
  ADMIN: ['ADMIN'] as const,
  OWNER_ADMIN: ['OWNER', 'ADMIN'] as const,
};

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'No autorizado. Solo super admins pueden enviar campañas.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = sendCampaignSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { audience, subject, message, isHtml } = validated.data;

    const members = await db.member.findMany({
      where: {
        isActive: true,
        role: { in: [...audienceRoleMap[audience]] },
        user: {
          email: {
            not: '',
          },
        },
      },
      select: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    const uniqueEmails = Array.from(
      new Set(
        members
          .map((member) => member.user.email.trim().toLowerCase())
          .filter((email) => email.length > 0)
      )
    );

    if (uniqueEmails.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron destinatarios para la audiencia seleccionada.' },
        { status: 400 }
      );
    }

    const results = await Promise.allSettled(
      uniqueEmails.map((email) =>
        sendAdminBroadcastEmail({
          toEmail: email,
          subject,
          message,
          isHtml,
        })
      )
    );

    const sentCount = results.filter((result) => result.status === 'fulfilled').length;
    const failedCount = results.length - sentCount;

    await logAuditAction({
      userId: session.user.id,
      action: AUDIT_ACTIONS.SEND_ADMIN_CAMPAIGN,
      resource: 'AdminCampaign',
      resourceId: `campaign-${Date.now()}`,
      changes: {
        audience,
        subject,
        isHtml,
        recipients: uniqueEmails.length,
        sentCount,
        failedCount,
      },
    });

    const status = sentCount > 0 ? 200 : 500;

    return NextResponse.json(
      {
        message:
          failedCount > 0
            ? 'Campaña enviada parcialmente. Revisa los logs para más detalles.'
            : 'Campaña enviada correctamente.',
        audience,
        recipients: uniqueEmails.length,
        sentCount,
        failedCount,
      },
      { status }
    );
  } catch (error) {
    console.error('Error enviando campaña admin:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al enviar campaña.' },
      { status: 500 }
    );
  }
}
