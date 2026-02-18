import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCurrentOrganization } from '@/lib/organization';
import {
  buildAccountingBalanceSnapshot,
  buildAccountingMonthlySummary,
  buildAccountingSeries,
} from '@/lib/utils/accounting-zimple';
import { accountingMonthlyQuerySchema, accountingSeriesQuerySchema } from '@/lib/validators/accounting';

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function toCsvRow(values: Array<string | number>) {
  return values.map((value) => csvCell(value)).join(';');
}

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
    const monthlyQuery = accountingMonthlyQuerySchema.parse({
      month: searchParams.get('month') || undefined,
      treasuryCategory: searchParams.get('treasuryCategory') || undefined,
      treasurySource: searchParams.get('treasurySource') || undefined,
    });
    const seriesQuery = accountingSeriesQuerySchema.parse({
      months: searchParams.get('months') || undefined,
      treasuryCategory: searchParams.get('treasuryCategory') || undefined,
      treasurySource: searchParams.get('treasurySource') || undefined,
    });

    const treasuryFilters = {
      treasuryCategory: monthlyQuery.treasuryCategory,
      treasurySource: monthlyQuery.treasurySource,
    };

    const [monthly, balance, series] = await Promise.all([
      buildAccountingMonthlySummary(organization.id, monthlyQuery.month, treasuryFilters),
      buildAccountingBalanceSnapshot(organization.id, monthlyQuery.month, treasuryFilters),
      buildAccountingSeries(organization.id, seriesQuery.months, treasuryFilters),
    ]);

    const rows: string[] = [];

    rows.push(toCsvRow(['TENDO - CONTABILIDAD ZIMPLE']));
    rows.push(toCsvRow(['Organización', organization.name]));
    rows.push(toCsvRow(['Período', monthly.monthLabel]));
    rows.push(toCsvRow(['Mes', monthly.month]));
    rows.push(toCsvRow(['Filtro tesorería categoría', monthlyQuery.treasuryCategory || 'TODAS']));
    rows.push(toCsvRow(['Filtro tesorería origen', monthlyQuery.treasurySource || 'TODOS']));
    rows.push('');

    rows.push(toCsvRow(['RESUMEN MENSUAL']));
    rows.push(toCsvRow(['Indicador', 'Valor']));
    rows.push(toCsvRow(['Ventas cobradas en el acto', monthly.immediateCashSalesTotal]));
    rows.push(toCsvRow(['Cobranzas de crédito', monthly.collectionsTotal]));
    rows.push(toCsvRow(['Cobros de proyectos', monthly.projectCollectionsTotal]));
    rows.push(toCsvRow(['Ingresos de tesorería', monthly.treasuryInflowsTotal]));
    rows.push(toCsvRow(['Ingresos de caja totales', monthly.cashInflowsTotal]));
    rows.push(toCsvRow(['Egresos operacionales', monthly.operationalExpensesTotal]));
    rows.push(toCsvRow(['Egresos de proyectos', monthly.projectOutflowsTotal]));
    rows.push(toCsvRow(['Egresos de tesorería', monthly.treasuryOutflowsTotal]));
    rows.push(toCsvRow(['Egresos de caja totales', monthly.cashOutflowsTotal]));
    rows.push(toCsvRow(['Flujo neto del mes', monthly.netCashFlow]));
    rows.push(toCsvRow(['Resultado operativo', monthly.operatingResult]));
    rows.push(toCsvRow(['Margen operativo (%)', monthly.operatingMarginPercent]));
    rows.push('');

    rows.push(toCsvRow(['BALANCE ZIMPLE']));
    rows.push(toCsvRow(['Indicador', 'Valor']));
    rows.push(toCsvRow(['CxC clientes', balance.assets.customerAccountsReceivable]));
    rows.push(toCsvRow(['CxC proyectos', balance.assets.projectAccountsReceivable]));
    rows.push(toCsvRow(['CxC total', balance.assets.accountsReceivable]));
    rows.push(toCsvRow(['Inventario al costo', balance.assets.inventoryAtCost]));
    rows.push(toCsvRow(['Activos totales', balance.assets.total]));
    rows.push(toCsvRow(['CxP', balance.liabilities.accountsPayable]));
    rows.push(toCsvRow(['Pasivos totales', balance.liabilities.total]));
    rows.push(toCsvRow(['Posición neta', balance.equity.netPosition]));
    rows.push('');

    rows.push(toCsvRow([`TENDENCIA (${series.length} meses)`]));
    rows.push(toCsvRow(['Mes', 'Ingresos caja', 'Egresos caja', 'Flujo neto', 'Resultado operativo']));
    for (const point of series) {
      rows.push(
        toCsvRow([
          point.monthLabel,
          point.cashInflowsTotal,
          point.cashOutflowsTotal,
          point.netCashFlow,
          point.operatingResult,
        ])
      );
    }

    if (monthly.warnings.length > 0 || balance.warnings.length > 0) {
      rows.push('');
      rows.push(toCsvRow(['NOTAS']));
      rows.push(toCsvRow(['Detalle']));
      [...monthly.warnings, ...balance.warnings].forEach((warning) => {
        rows.push(toCsvRow([warning]));
      });
    }

    const csv = `\uFEFF${rows.join('\n')}`;
    const fileName = `contabilidad-zimple-${monthly.month}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error en exportación CSV contable:', error);
    return NextResponse.json(
      { error: 'Error al generar exportación CSV de contabilidad' },
      { status: 500 }
    );
  }
}
