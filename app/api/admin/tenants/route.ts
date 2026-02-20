import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { cleanRUT } from '@/lib/utils/rut-validator';
import { generateUniqueSlug } from '@/lib/utils/slugify';
import { logAuditAction, AUDIT_ACTIONS } from '@/lib/audit';
import { sendTenantWelcomeEmail } from '@/lib/email';
import {
  buildInitialSubscription,
  mapOrganizationStatusToSubscriptionStatus,
} from '@/lib/utils/subscription';
import { getSubscriptionSystemConfig } from '@/lib/system-settings';
import { buildModulesForTrack, inferTrackFromModules, normalizeModules } from '@/lib/constants/modules';

const createTenantSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  rut: z.string().min(8, 'RUT inválido'),
  ownerEmail: z.string().email('Email inválido'),
  ownerName: z.string().optional(),
  plan: z.enum(['BASIC', 'PRO']),
  businessTrack: z.enum(['RETAIL', 'SERVICES', 'MIXED']).optional(),
  status: z.enum(['ACTIVE', 'TRIAL', 'SUSPENDED']).default('ACTIVE'),
  modules: z.array(z.string()).default([]),
  additionalModules: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    // Verificar autenticación y permisos de super admin
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

    // Obtener todas las organizaciones con sus miembros propietarios
    const organizations = await db.organization.findMany({
      include: {
        subscription: {
          select: {
            id: true,
            planId: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            trialEndsAt: true,
            mrr: true,
            isFounderPartner: true,
            discountPercent: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        members: {
          where: { role: 'OWNER' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transformar datos para la respuesta
    const tenantsData = organizations.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      rut: org.rut,
      logoUrl: org.logoUrl,
      status: org.status,
      plan: org.plan,
      modules: normalizeModules(org.modules),
      businessTrack: inferTrackFromModules(org.modules),
      owner: org.members[0]?.user || null,
      membersCount: org._count.members,
      subscription: org.subscription
        ? {
            id: org.subscription.id,
            planId: org.subscription.planId,
            status: org.subscription.status,
            currentPeriodStart: org.subscription.currentPeriodStart,
            currentPeriodEnd: org.subscription.currentPeriodEnd,
            trialStartedAt: org.subscription.createdAt,
            trialEndsAt: org.subscription.trialEndsAt,
            mrr: Number(org.subscription.mrr),
            isFounderPartner: org.subscription.isFounderPartner,
            discountPercent: org.subscription.discountPercent,
            createdAt: org.subscription.createdAt,
            updatedAt: org.subscription.updatedAt,
          }
        : null,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    }));

    return NextResponse.json({
      tenants: tenantsData,
      total: tenantsData.length,
    });
  } catch (error) {
    console.error('Error al obtener tenants:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Verificar autenticación y permisos de super admin
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

    const body = await request.json();

    // Validar datos de entrada
    const validatedFields = createTenantSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, rut, ownerEmail, ownerName, plan, businessTrack, status, modules, additionalModules } = validatedFields.data;
    if (plan === 'BASIC' && businessTrack === 'MIXED') {
      return NextResponse.json(
        { error: 'El plan Basic permite solo un track: Retail o Servicios' },
        { status: 400 }
      );
    }

    const normalizedModules = businessTrack
      ? buildModulesForTrack(businessTrack, additionalModules ?? modules)
      : normalizeModules(modules);
    const subscriptionStatus = mapOrganizationStatusToSubscriptionStatus(status);

    // Limpiar y validar RUT
    const cleanedRUT = cleanRUT(rut);

    // Verificar si el RUT ya está registrado
    const existingOrg = await db.organization.findUnique({
      where: { rut: cleanedRUT },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Este RUT ya está registrado' },
        { status: 400 }
      );
    }

    // Generar slug único
    const existingSlugs = await db.organization.findMany({
      select: { slug: true },
    });
    const slug = generateUniqueSlug(
      name,
      existingSlugs.map((org: { slug: string }) => org.slug)
    );

    // Buscar si el usuario owner ya existe
    let owner = await db.user.findUnique({
      where: { email: ownerEmail },
    });
    let temporaryPassword: string | null = null;

    const subscriptionConfig = await getSubscriptionSystemConfig();

    // Crear organización con owner en una transacción
    const result = await db.$transaction(async (tx: any) => {
      // Si el usuario no existe, crearlo con password temporal
      if (!owner) {
        temporaryPassword = Math.random().toString(36).slice(-10); // Password temporal random
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

        owner = await tx.user.create({
          data: {
            email: ownerEmail,
            name: ownerName || ownerEmail.split('@')[0], // Usar parte del email si no hay nombre
            password: hashedPassword,
          },
        });

        console.log(`Usuario creado: ${ownerEmail} con password temporal: ${temporaryPassword}`);
      }

      // Crear la organización
      const organization = await tx.organization.create({
        data: {
          name,
          slug,
          rut: cleanedRUT,
          status,
          plan,
          modules: normalizedModules,
        },
      });

      const subscriptionData = buildInitialSubscription({
        planId: plan,
        status: subscriptionStatus,
        config: subscriptionConfig,
      });

      await tx.subscription.create({
        data: {
          organizationId: organization.id,
          planId: subscriptionData.planId,
          status: subscriptionData.status,
          currentPeriodStart: subscriptionData.currentPeriodStart,
          currentPeriodEnd: subscriptionData.currentPeriodEnd,
          trialEndsAt: subscriptionData.trialEndsAt,
          mrr: subscriptionData.mrr,
          isFounderPartner: subscriptionData.isFounderPartner,
          discountPercent: subscriptionData.discountPercent,
        },
      });

      // Crear la membresía del owner
      await tx.member.create({
        data: {
          userId: owner!.id,
          organizationId: organization.id,
          role: 'OWNER',
        },
      });

      // Actualizar currentOrganizationId del owner
      await tx.user.update({
        where: { id: owner!.id },
        data: { currentOrganizationId: organization.id },
      });

      return { organization, owner: owner! };
    });

    // Registrar acción en audit log
    await logAuditAction({
      userId: session.user.id,
      action: AUDIT_ACTIONS.CREATE_TENANT,
      resource: 'Organization',
      resourceId: result.organization.id,
      changes: { 
        name, 
        slug, 
        rut: cleanedRUT, 
        status, 
        plan, 
        modules: normalizedModules,
        businessTrack,
        ownerId: result.owner.id,
        ownerEmail: result.owner.email,
      },
    });

    if (temporaryPassword) {
      try {
        await sendTenantWelcomeEmail({
          toEmail: ownerEmail,
          organizationName: result.organization.name,
          temporaryPassword,
        });
      } catch (emailError) {
        console.error('Error enviando email de bienvenida al owner:', emailError);
      }
    }

    return NextResponse.json(
      {
        message: 'Tenant creado exitosamente',
        tenant: result.organization,
        owner: {
          id: result.owner.id,
          email: result.owner.email,
          name: result.owner.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear tenant:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
