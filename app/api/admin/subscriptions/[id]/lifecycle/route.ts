import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logAuditAction } from '@/lib/audit';

const lifecycleSchema = z.object({
  action: z.enum(['ACTIVATE', 'RENEW', 'SUSPEND', 'CANCEL']),
});

function addOneMonth(date: Date) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  return result;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id } = await params;
    const body = await request.json();

    const validated = lifecycleSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const subscription = await db.subscription.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            status: true,
            name: true,
          },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Suscripción no encontrada' },
        { status: 404 }
      );
    }

    const action = validated.data.action;
    const now = new Date();

    if (action === 'RENEW' && subscription.status === 'CANCELED') {
      return NextResponse.json(
        { error: 'No se puede renovar una suscripción cancelada' },
        { status: 400 }
      );
    }

    const result = await db.$transaction(async (tx) => {
      let subscriptionUpdate:
        | {
            status?: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELED';
            currentPeriodStart?: Date;
            currentPeriodEnd?: Date;
            canceledAt?: Date | null;
          }
        | undefined;

      let organizationStatus: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | undefined;

      switch (action) {
        case 'ACTIVATE': {
          const start = now;
          const end = addOneMonth(start);

          subscriptionUpdate = {
            status: 'ACTIVE',
            currentPeriodStart: start,
            currentPeriodEnd: end,
            canceledAt: null,
          };
          organizationStatus = 'ACTIVE';
          break;
        }
        case 'RENEW': {
          const baseStart = subscription.currentPeriodEnd > now ? subscription.currentPeriodEnd : now;
          const nextEnd = addOneMonth(baseStart);

          subscriptionUpdate = {
            status: 'ACTIVE',
            currentPeriodStart: baseStart,
            currentPeriodEnd: nextEnd,
            canceledAt: null,
          };
          organizationStatus = 'ACTIVE';
          break;
        }
        case 'SUSPEND': {
          subscriptionUpdate = {
            status: 'SUSPENDED',
          };
          organizationStatus = 'SUSPENDED';
          break;
        }
        case 'CANCEL': {
          subscriptionUpdate = {
            status: 'CANCELED',
            canceledAt: now,
          };
          organizationStatus = 'SUSPENDED';
          break;
        }
      }

      const updatedSubscription = await tx.subscription.update({
        where: { id: subscription.id },
        data: subscriptionUpdate,
      });

      if (organizationStatus) {
        await tx.organization.update({
          where: { id: subscription.organizationId },
          data: {
            status: organizationStatus,
          },
        });
      }

      return updatedSubscription;
    });

    await logAuditAction({
      userId: session.user.id,
      action: 'UPDATE_SUBSCRIPTION_LIFECYCLE',
      resource: 'Subscription',
      resourceId: subscription.id,
      changes: {
        subscriptionId: subscription.id,
        organizationId: subscription.organization.id,
        organizationName: subscription.organization.name,
        action,
        previousStatus: subscription.status,
        newStatus: result.status,
        previousPeriodEnd: subscription.currentPeriodEnd,
        newPeriodEnd: result.currentPeriodEnd,
      },
    });

    return NextResponse.json({
      message: 'Suscripción actualizada correctamente',
      subscription: result,
    });
  } catch (error) {
    console.error('Error actualizando lifecycle de suscripción:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
