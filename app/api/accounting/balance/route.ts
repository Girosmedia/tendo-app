import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCurrentOrganization } from '@/lib/organization';
import { accountingBalanceQuerySchema } from '@/lib/validators/accounting';
import { buildAccountingBalanceSnapshot } from '@/lib/utils/accounting-zimple';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const query = accountingBalanceQuerySchema.parse({
      month: searchParams.get('month') || undefined,
      treasuryCategory: searchParams.get('treasuryCategory') || undefined,
      treasurySource: searchParams.get('treasurySource') || undefined,
    });

    const balance = await buildAccountingBalanceSnapshot(organization.id, query.month, {
      treasuryCategory: query.treasuryCategory,
      treasurySource: query.treasurySource,
    });

    return NextResponse.json({ balance });
  } catch (error) {
    console.error('Error en balance contable zimple:', error);
    return NextResponse.json(
      { error: 'Error al obtener balance contable' },
      { status: 500 }
    );
  }
}
