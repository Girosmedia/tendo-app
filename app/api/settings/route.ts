import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { getCurrentOrganization, isAdmin } from '@/lib/organization';
import { logAuditAction, AUDIT_ACTIONS } from '@/lib/audit';

const updateSettingsSchema = z.object({
  businessName: z.string().min(1, 'El nombre comercial es requerido').optional(),
  tradeName: z.string().optional().nullable(),
  rut: z.string().min(8, 'RUT inválido').optional(),
  logoUrl: z.string().url('URL de logo inválida').optional().nullable(),
  
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  country: z.string().optional(),
  
  phone: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable(),
  website: z.string().url('URL inválida').optional().nullable(),
  
  taxRegime: z.string().optional().nullable(),
  economicActivity: z.string().optional().nullable(),
  
  timezone: z.string().optional(),
  currency: z.string().optional(),
  locale: z.string().optional(),
});

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const organization = await getCurrentOrganization();

    if (!organization) {
      return NextResponse.json(
        { error: 'No perteneces a ninguna organización' },
        { status: 404 }
      );
    }

    // Si no tiene settings, crear configuración por defecto
    if (!organization.settings) {
      const settings = await db.organizationSettings.create({
        data: {
          organizationId: organization.id,
          businessName: organization.name,
          rut: organization.rut,
          logoUrl: organization.logoUrl,
        },
      });

      return NextResponse.json({ settings });
    }

    return NextResponse.json({ settings: organization.settings });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que es ADMIN o OWNER
    const canManageSettings = await isAdmin();
    if (!canManageSettings) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar la configuración' },
        { status: 403 }
      );
    }

    const organization = await getCurrentOrganization();

    if (!organization) {
      return NextResponse.json(
        { error: 'No perteneces a ninguna organización' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedFields = updateSettingsSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updateData = validatedFields.data;

    // Obtener configuración actual
    let currentSettings = organization.settings;

    // Si no existe, crear nueva
    if (!currentSettings) {
      currentSettings = await db.organizationSettings.create({
        data: {
          organizationId: organization.id,
          businessName: organization.name,
          rut: organization.rut,
          ...updateData,
        },
      });

      await logAuditAction({
        userId: session.user.id,
        action: 'CREATE_ORGANIZATION_SETTINGS',
        resource: 'OrganizationSettings',
        resourceId: currentSettings.id,
        changes: updateData as any,
      });

      return NextResponse.json({
        message: 'Configuración creada exitosamente',
        settings: currentSettings,
      });
    }

    // Actualizar existente
    const updatedSettings = await db.organizationSettings.update({
      where: { organizationId: organization.id },
      data: updateData,
    });

    // Registrar en audit log
    await logAuditAction({
      userId: session.user.id,
      action: 'UPDATE_ORGANIZATION_SETTINGS',
      resource: 'OrganizationSettings',
      resourceId: updatedSettings.id,
      changes: {
        from: currentSettings,
        to: updateData,
      } as any,
    });

    return NextResponse.json({
      message: 'Configuración actualizada exitosamente',
      settings: updatedSettings,
    });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
