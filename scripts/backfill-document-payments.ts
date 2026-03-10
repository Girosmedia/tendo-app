import 'dotenv/config';
import { PrismaClient } from '@/lib/generated/prisma/client/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { roundCashPaymentAmount } from '@/lib/utils/cash-rounding';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface ScriptOptions {
  apply: boolean;
  organizationId?: string;
  batchSize: number;
}

function parseOptions(): ScriptOptions {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');

  const organizationArg = args.find((arg) => arg.startsWith('--organizationId='));
  const organizationId = organizationArg?.split('=')[1];

  const batchArg = args.find((arg) => arg.startsWith('--batch='));
  const batchSize = batchArg ? Number(batchArg.split('=')[1]) : 200;

  return {
    apply,
    organizationId,
    batchSize: Number.isFinite(batchSize) && batchSize > 0 ? batchSize : 200,
  };
}

function getSinglePaymentAmount(paymentMethod: string, total: number): number {
  if (paymentMethod === 'CASH') {
    return roundCashPaymentAmount(total);
  }

  return total;
}

async function main() {
  const options = parseOptions();

  console.log('=== Backfill document_payments faltantes ===');
  console.log(`Modo: ${options.apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`Batch: ${options.batchSize}`);
  if (options.organizationId) {
    console.log(`OrganizationId: ${options.organizationId}`);
  }

  let totalScanned = 0;
  let totalCreated = 0;
  let totalSkippedMulti = 0;

  let hasMore = true;
  let cursorId: string | undefined;

  while (hasMore) {
    const documents = await prisma.document.findMany({
      where: {
        status: 'PAID',
        paymentMethod: {
          in: ['CASH', 'CARD', 'TRANSFER', 'CHECK', 'MULTI'],
        },
        payments: {
          none: {},
        },
        ...(options.organizationId ? { organizationId: options.organizationId } : {}),
      },
      select: {
        id: true,
        paymentMethod: true,
        cardType: true,
        total: true,
      },
      orderBy: {
        id: 'asc',
      },
      ...(cursorId
        ? {
            cursor: { id: cursorId },
            skip: 1,
          }
        : {}),
      take: options.batchSize,
    });

    if (documents.length === 0) {
      break;
    }

    totalScanned += documents.length;
    cursorId = documents[documents.length - 1].id;
    hasMore = documents.length === options.batchSize;

    for (const document of documents) {
      if (document.paymentMethod === 'MULTI') {
        totalSkippedMulti += 1;
        continue;
      }

      const amount = getSinglePaymentAmount(document.paymentMethod, Number(document.total));

      if (options.apply) {
        await prisma.document.update({
          where: {
            id: document.id,
          },
          data: {
            payments: {
              create: {
                paymentMethod: document.paymentMethod,
                cardType: document.paymentMethod === 'CARD' ? document.cardType : null,
                amount,
              },
            },
          },
        });
      }

      totalCreated += 1;
    }

    console.log(`Procesados: ${totalScanned} | ${options.apply ? 'creados' : 'a crear'}: ${totalCreated}`);
  }

  console.log('\n=== Resumen ===');
  console.log(`Documentos escaneados: ${totalScanned}`);
  console.log(`Documentos MULTI sin detalle omitidos: ${totalSkippedMulti}`);
  console.log(`${options.apply ? 'DocumentPayment creados' : 'DocumentPayment a crear'}: ${totalCreated}`);

  if (!options.apply) {
    console.log('\nEjecuta con --apply para persistir cambios.');
  }
}

main()
  .catch((error) => {
    console.error('Error en backfill DocumentPayment:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
