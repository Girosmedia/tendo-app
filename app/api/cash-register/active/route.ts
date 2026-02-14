import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentOrganization } from '@/lib/organization';

/**
 * GET /api/cash-register/active
 * Verificar si el usuario actual tiene una caja abierta
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    // Buscar caja abierta del usuario
    const activeCashRegister = await db.cashRegister.findFirst({
      where: {
        organizationId: organization.id,
        openedBy: session.user.id,
        status: 'OPEN',
      },
      select: {
        id: true,
        openedAt: true,
        openingCash: true,
      },
    });

    return NextResponse.json({
      hasActiveCashRegister: !!activeCashRegister,
      cashRegister: activeCashRegister ? {
        id: activeCashRegister.id,
        openedAt: activeCashRegister.openedAt.toISOString(),
        openingCash: Number(activeCashRegister.openingCash),
      } : null,
    });
  } catch (error) {
    console.error('Error verificando caja activa:', error);
    return NextResponse.json(
      { error: 'Error al verificar caja activa' },
      { status: 500 }
    );
  }
}
