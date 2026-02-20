import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { getOrCreateSystemSettings, updateSystemSettings } from '@/lib/system-settings';

const updateSystemSettingsSchema = z.object({
  trialDays: z.number().int().min(1).max(365),
  founderProgramEnabled: z.boolean(),
  founderTrialDays: z.number().int().min(1).max(365),
  founderDiscountPercent: z.number().int().min(0).max(100),
});

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const settings = await getOrCreateSystemSettings();

    return NextResponse.json({
      settings: {
        id: settings.id,
        trialDays: settings.trialDays,
        founderProgramEnabled: settings.founderProgramEnabled,
        founderTrialDays: settings.founderTrialDays,
        founderDiscountPercent: settings.founderDiscountPercent,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error al obtener system settings:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = updateSystemSettingsSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { trialDays, founderProgramEnabled, founderTrialDays, founderDiscountPercent } = validated.data;

    const updated = await updateSystemSettings({
      trialDays,
      founderProgramEnabled,
      founderTrialDays,
      founderDiscountPercent,
    });

    return NextResponse.json({
      message: 'Parámetros del sistema actualizados',
      settings: updated,
    });
  } catch (error) {
    console.error('Error al actualizar system settings:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
