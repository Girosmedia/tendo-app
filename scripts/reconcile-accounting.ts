/**
 * scripts/reconcile-accounting.ts
 *
 * Script de reconciliación contable.
 * Compara los resultados del motor nuevo (accounting-engine) con los valores
 * calculados por el motor legacy (accounting-zimple) para detectar discrepancias.
 *
 * Uso:
 *   pnpm tsx scripts/reconcile-accounting.ts              ← mes actual, todas las orgs
 *   pnpm tsx scripts/reconcile-accounting.ts --period=2026-01   ← mes específico (YYYY-MM)
 *   pnpm tsx scripts/reconcile-accounting.ts --orgId=abc123     ← una organización
 *   pnpm tsx scripts/reconcile-accounting.ts --threshold=10     ← alerta si dif > 10%
 */

import 'dotenv/config';
import { db } from '@/lib/db';
import { calculateManagementMetrics, calculateCashFlowMetrics } from '@/lib/utils/accounting-engine';
import { startOfMonth, endOfMonth, parseISO, format } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const CHILE_TIMEZONE = 'America/Santiago';

// ── Argumentos CLI ───────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [key, val] = a.replace('--', '').split('=');
      return [key, val ?? 'true'];
    })
);

const targetPeriod: string = args['period'] ?? format(new Date(), 'yyyy-MM');
const targetOrgId: string | undefined = args['orgId'];
const threshold = parseFloat(args['threshold'] ?? '5'); // % de diferencia tolerable

// ── Helpers ──────────────────────────────────────────────────────────────────
function toNumber(val: unknown): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && 'toNumber' in (val as object)) {
    return (val as { toNumber: () => number }).toNumber();
  }
  return Number(val) || 0;
}

function formatCLP(amount: number): string {
  return `$ ${amount.toLocaleString('es-CL')}`;
}

function diffPct(a: number, b: number): number {
  if (a === 0 && b === 0) return 0;
  const base = Math.abs(a) > 0 ? a : b;
  return Math.round(Math.abs(a - b) / Math.abs(base) * 1000) / 10;
}

function badge(pct: number, thr: number): string {
  return pct > thr ? `⚠️  ${pct}%` : `✅  ${pct}%`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  // Calcular rango del período en zona horaria Santiago
  const baseDate = parseISO(`${targetPeriod}-01`);
  const zonedBase = toZonedTime(baseDate, CHILE_TIMEZONE);
  const startDate = fromZonedTime(startOfMonth(zonedBase), CHILE_TIMEZONE);
  const endDate   = fromZonedTime(endOfMonth(zonedBase),   CHILE_TIMEZONE);

  console.log('\n══════════════════════════════════════════════════════════');
  console.log(`  RECONCILIACIÓN CONTABLE — ${targetPeriod} (America/Santiago)`);
  console.log(`  Período: ${format(startDate, 'dd/MM/yyyy HH:mm')} → ${format(endDate, 'dd/MM/yyyy HH:mm')}`);
  console.log(`  Umbral de alerta: ${threshold}%`);
  console.log('══════════════════════════════════════════════════════════\n');

  // Obtener organizaciones activas con ventas en el período
  const orgs = await db.organization.findMany({
    where: {
      ...(targetOrgId ? { id: targetOrgId } : {}),
      status: 'ACTIVE',
      documents: {
        some: {
          type: 'SALE',
          status: 'PAID',
          issuedAt: { gte: startDate, lte: endDate },
        },
      },
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  if (orgs.length === 0) {
    console.log('  ⚪ No hay organizaciones activas con ventas en el período.');
    return;
  }

  console.log(`  Organizaciones a reconciliar: ${orgs.length}\n`);

  let warnings = 0;

  for (const org of orgs) {
    console.log(`─── ${org.name} (${org.id}) ───`);

    // ── Nuevo motor (accounting-engine) ─────────────────────────────────────
    const [mgmt, cash] = await Promise.all([
      calculateManagementMetrics(org.id, startDate, endDate),
      calculateCashFlowMetrics(org.id, startDate, endDate),
    ]);

    // ── Motor legacy (accounting-zimple / KPI route) ─────────────────────────
    const legacyDocsAgg = await db.document.aggregate({
      where: {
        organizationId: org.id,
        type: 'SALE',
        status: 'PAID',
        issuedAt: { gte: startDate, lte: endDate },
      },
      _sum: { subtotal: true, total: true },
    });

    const legacyItems = await db.documentItem.findMany({
      where: {
        document: {
          organizationId: org.id,
          type: 'SALE',
          status: 'PAID',
          issuedAt: { gte: startDate, lte: endDate },
        },
      },
      select: {
        quantity: true,
        product: { select: { cost: true } },
      },
    });

    // COGS legacy: usa product.cost (sin snapshot)
    const legacyCogs = legacyItems.reduce((acc, item) => {
      const cost = toNumber(item.product?.cost);
      return acc + toNumber(item.quantity) * cost;
    }, 0);

    const legacyRevenue  = Math.round(toNumber(legacyDocsAgg._sum.subtotal));
    const legacyCogsFinal = Math.round(legacyCogs);
    const legacyGrossMargin = legacyRevenue - legacyCogsFinal;

    // ── Tabla de comparación ─────────────────────────────────────────────────
    console.log('\n  INGRESOS NETOS (devengado):');
    console.log(`    Motor nuevo :  ${formatCLP(mgmt.revenueNet)}`);
    console.log(`    Motor legacy:  ${formatCLP(legacyRevenue)}`);
    console.log(`    Diferencia  :  ${badge(diffPct(mgmt.revenueNet, legacyRevenue), threshold)}`);

    console.log('\n  COGS (costo de ventas):');
    console.log(`    Motor nuevo :  ${formatCLP(mgmt.cogs)}  (snapshot unitCost)`);
    console.log(`    Motor legacy:  ${formatCLP(legacyCogsFinal)}  (product.cost live)`);
    console.log(`    Diferencia  :  ${badge(diffPct(mgmt.cogs, legacyCogsFinal), threshold)}`);
    if (mgmt.cogs !== legacyCogsFinal) {
      console.log(`    → Diferencia esperada si se actualizaron precios de costo del catálogo.`);
    }

    console.log('\n  MARGEN BRUTO:');
    console.log(`    Motor nuevo :  ${formatCLP(mgmt.grossMargin)}  (${mgmt.grossMarginPct}%)`);
    console.log(`    Motor legacy:  ${formatCLP(legacyGrossMargin)}`);
    console.log(`    Diferencia  :  ${badge(diffPct(mgmt.grossMargin, legacyGrossMargin), threshold)}`);

    console.log('\n  FLUJO DE CAJA:');
    console.log(`    Entradas    :  ${formatCLP(cash.cashInflows)}`);
    console.log(`    Salidas     :  ${formatCLP(cash.cashOutflows)}`);
    console.log(`    Flujo neto  :  ${formatCLP(cash.netCashFlow)}`);
    console.log(`    CxC emitida :  ${formatCLP(cash.creditSalesPending)}`);

    if (mgmt.warnings.length > 0) {
      console.log('\n  ADVERTENCIAS DE CALIDAD:');
      mgmt.warnings.forEach((w) => console.log(`    ⚠️  ${w}`));
    }

    const isOk =
      diffPct(mgmt.revenueNet, legacyRevenue) <= threshold &&
      diffPct(mgmt.grossMargin, legacyGrossMargin) <= threshold;

    if (!isOk) warnings++;
    console.log(`\n  Estado: ${isOk ? '✅  OK' : '⚠️  DIFERENCIA SUPERA UMBRAL'}`);
    console.log('');
  }

  console.log('══════════════════════════════════════════════════════════');
  console.log(`  RESUMEN: ${orgs.length} org(s) analizadas — ${warnings} con diferencias > ${threshold}%`);
  if (warnings > 0) {
    console.log('  ⚠️  Revisa las organizaciones marcadas. Puede indicar que los precios de');
    console.log('      costo del catálogo fueron modificados después de registrar las ventas.');
    console.log('      Ejecuta el backfill de unitCost para normalizar los datos históricos.');
  }
  console.log('══════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('Error en reconciliación:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
