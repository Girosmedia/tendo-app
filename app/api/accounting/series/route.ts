import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCurrentOrganization } from '@/lib/organization';
import { accountingSeriesQuerySchema } from '@/lib/validators/accounting';
import { buildAccountingSeries } from '@/lib/utils/accounting-zimple';

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
    const query = accountingSeriesQuerySchema.parse({
      months: searchParams.get('months') || undefined,
      treasuryCategory: searchParams.get('treasuryCategory') || undefined,
      treasurySource: searchParams.get('treasurySource') || undefined,
    });

    const series = await buildAccountingSeries(organization.id, query.months, {
      treasuryCategory: query.treasuryCategory,
      treasurySource: query.treasurySource,
    });

    return NextResponse.json({ series, months: query.months });
  } catch (error) {
    console.error('Error en serie contable:', error);
    return NextResponse.json(
      { error: 'Error al obtener serie contable mensual' },
      { status: 500 }
    );
  }
}
