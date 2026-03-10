/**
 * backfill-treasury-movements.ts
 *
 * Crea TreasuryMovement para eventos históricos que no los tienen:
 *   1. Documentos pagados al contado (no-crédito) sin TreasuryMovement
 *   2. Pagos de crédito (Payment.creditId != null) sin TreasuryMovement
 *
 * Uso:
 *   pnpm tsx scripts/backfill-treasury-movements.ts              # dry-run
 *   pnpm tsx scripts/backfill-treasury-movements.ts --apply      # persiste cambios
 */

import 'dotenv/config';
import { PrismaClient, MemberRole, TreasuryMovementSource } from '@/lib/generated/prisma/client/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });
const DRY_RUN = !process.argv.includes('--apply');

/** Mapea PaymentMethod al campo source de TreasuryMovement */
function toTreasurySource(paymentMethod: string): TreasuryMovementSource {
  switch (paymentMethod) {
    case 'CASH':     return TreasuryMovementSource.CASH;
    case 'TRANSFER': return TreasuryMovementSource.TRANSFER;
    case 'CARD':
    case 'CHECK':    return TreasuryMovementSource.BANK;
    default:         return TreasuryMovementSource.OTHER; // MULTI, etc.
  }
}

/** Devuelve un mapa { organizationId → userId del primer ORG_ADMIN } */
async function getOrgAdminMap(orgIds: string[]): Promise<Map<string, string>> {
  const members = await db.member.findMany({
    where: {
      organizationId: { in: orgIds },
      role: MemberRole.OWNER,
    },
    select: { organizationId: true, userId: true },
  });
  const map = new Map<string, string>();
  for (const m of members) {
    if (!map.has(m.organizationId)) map.set(m.organizationId, m.userId);
  }
  return map;
}

async function backfillDocumentPayments() {
  console.log('\n=== 1. Documentos pagados sin TreasuryMovement ===');

  // Busca documentos PAID, paymentMethod ≠ CREDIT, sin TreasuryMovement asociado
  const docs = await db.document.findMany({
    where: {
      status: 'PAID',
      paymentMethod: { not: 'CREDIT' },
      treasuryMovements: { none: {} },
    },
    select: {
      id: true,
      organizationId: true,
      docNumber: true,
      paymentMethod: true,
      total: true,
      paidAt: true,
      createdBy: true,
    },
  });

  console.log(`  Encontrados: ${docs.length} documentos sin TreasuryMovement`);

  if (DRY_RUN) {
    docs.slice(0, 5).forEach((d) =>
      console.log(`  [DRY] Doc #${d.docNumber} ${d.paymentMethod} $${Number(d.total).toLocaleString('es-CL')}`)
    );
    if (docs.length > 5) console.log(`  ... y ${docs.length - 5} más`);
    return 0;
  }

  let created = 0;
  for (const doc of docs) {
    const pm = doc.paymentMethod ?? 'OTHER';
    // Para CASH usamos redondeo al múltiplo de 10 más cercano (↓) para consistencia
    const rawTotal = Number(doc.total);
    const amount = pm === 'CASH' ? Math.floor(rawTotal / 10) * 10 : rawTotal;

    await db.treasuryMovement.create({
      data: {
        organizationId: doc.organizationId,
        type: 'INFLOW',
        category: 'SALE_INCOME',
        source: toTreasurySource(pm),
        title: `Venta #${doc.docNumber}`,
        amount,
        occurredAt: doc.paidAt ?? new Date(),
        createdBy: doc.createdBy,
        documentId: doc.id,
      },
    });
    created++;
  }
  console.log(`  ✔ Creados: ${created} TreasuryMovement`);
  return created;
}

async function backfillCreditPayments() {
  console.log('\n=== 2. Pagos de crédito sin TreasuryMovement ===');

  // Todos los Payment son abonos de crédito (creditId es requerido)
  const payments = await db.payment.findMany({
    where: {
      treasuryMovement: null,
    },
    include: {
      credit: {
        include: {
          customer: { select: { name: true } },
        },
      },
    },
  });

  console.log(`  Encontrados: ${payments.length} pagos de crédito sin TreasuryMovement`);

  if (DRY_RUN) {
    payments.slice(0, 5).forEach((p) =>
      console.log(
        `  [DRY] Payment ${p.id.slice(0, 8)} ${p.paymentMethod} $${Number(p.amount).toLocaleString('es-CL')} – ${p.credit?.customer?.name}`
      )
    );
    if (payments.length > 5) console.log(`  ... y ${payments.length - 5} más`);
    return 0;
  }

  // Obtener admin de cada org para usar como createdBy
  const orgIds = [...new Set(payments.map((p) => p.organizationId))];
  const adminMap = await getOrgAdminMap(orgIds);

  let created = 0;
  for (const payment of payments) {
    const customerName = payment.credit?.customer?.name ?? 'Cliente desconocido';
    const createdBy = adminMap.get(payment.organizationId) ?? payment.organizationId;
    await db.treasuryMovement.create({
      data: {
        organizationId: payment.organizationId,
        type: 'INFLOW',
        category: 'CREDIT_PAYMENT',
        source: toTreasurySource(payment.paymentMethod),
        title: `Abono crédito · ${customerName}`,
        amount: Number(payment.amount),
        occurredAt: payment.paidAt,
        createdBy,
        creditPaymentId: payment.id,
      },
    });
    created++;
  }
  console.log(`  ✔ Creados: ${created} TreasuryMovement`);
  return created;
}

async function main() {
  console.log(`\n🚀 Backfill TreasuryMovement – ${DRY_RUN ? 'DRY RUN (sin cambios)' : '⚠️  MODO APPLY'}`);
  console.log('   Usa --apply para persistir los cambios.\n');

  const d1 = await backfillDocumentPayments();
  const d2 = await backfillCreditPayments();

  console.log('\n─────────────────────────────────────────');
  console.log(`Total TreasuryMovement ${DRY_RUN ? 'que se crearían' : 'creados'}: ${d1 + d2}`);
  if (DRY_RUN) {
    console.log('\n💡 Ejecuta con --apply para guardar los cambios.');
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); await pool.end(); });
