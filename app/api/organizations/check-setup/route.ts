import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';

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

    // Verificar tareas completadas
    const [
      productsCount,
      customersCount,
      documentsCount,
      teamMembersCount,
    ] = await Promise.all([
      db.product.count({
        where: { organizationId: organization.id },
      }),
      db.customer.count({
        where: { organizationId: organization.id },
      }),
      db.document.count({
        where: { organizationId: organization.id },
      }),
      db.member.count({
        where: { 
          organizationId: organization.id,
          isActive: true,
        },
      }),
    ]);

    const tasks = [
      {
        id: 'add-product',
        title: 'Agrega tu primer producto',
        description: 'Registra al menos un producto o servicio',
        completed: productsCount > 0,
        path: '/dashboard/products',
      },
      {
        id: 'add-customer',
        title: 'Registra un cliente',
        description: 'Añade tu primer cliente',
        completed: customersCount > 0,
        path: '/dashboard/customers',
      },
      {
        id: 'first-sale',
        title: 'Realiza tu primera venta',
        description: 'Genera tu primer documento de venta',
        completed: documentsCount > 0,
        path: '/dashboard/pos',
      },
      {
        id: 'invite-team',
        title: 'Invita a tu equipo',
        description: 'Agrega al menos un miembro más',
        completed: teamMembersCount > 1,
        path: '/dashboard/team',
      },
    ];

    const completedCount = tasks.filter((t) => t.completed).length;
    const isSetupComplete = completedCount === tasks.length;

    // Verificar si la org fue creada hace menos de 7 días
    const orgCreatedAt = organization.createdAt;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const isRecent = orgCreatedAt > sevenDaysAgo;

    return NextResponse.json({
      tasks,
      completedCount,
      totalCount: tasks.length,
      isSetupComplete,
      showChecklist: !isSetupComplete && isRecent,
    });
  } catch (error) {
    console.error('Error al verificar setup:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
