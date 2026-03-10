import 'dotenv/config';
import { PrismaClient } from '@/lib/generated/prisma/client/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

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

async function main() {
  const options = parseOptions();

  console.log('=== Backfill unitCost en document_items ===');
  console.log(`Modo: ${options.apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`Batch: ${options.batchSize}`);
  if (options.organizationId) {
    console.log(`OrganizationId: ${options.organizationId}`);
  }

  let totalScanned = 0;
  let totalUpdated = 0;
  let totalWithoutProduct = 0;
  let totalWithoutCost = 0;

  let hasMore = true;
  let cursorId: string | undefined;

  while (hasMore) {
    const items = await prisma.documentItem.findMany({
      where: {
        unitCost: null,
        productId: { not: null },
        ...(options.organizationId
          ? {
              document: {
                organizationId: options.organizationId,
              },
            }
          : {}),
      },
      select: {
        id: true,
        productId: true,
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

    if (items.length === 0) {
      break;
    }

    totalScanned += items.length;
    cursorId = items[items.length - 1].id;
    hasMore = items.length === options.batchSize;

    const productIds = Array.from(
      new Set(
        items
          .map((item) => item.productId)
          .filter((productId): productId is string => Boolean(productId))
      )
    );

    if (productIds.length === 0) {
      totalWithoutProduct += items.length;
      continue;
    }

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        cost: true,
      },
    });

    const costMap = new Map<string, number | null>();
    for (const product of products) {
      costMap.set(product.id, product.cost ? Number(product.cost) : null);
    }

    for (const item of items) {
      if (!item.productId) {
        totalWithoutProduct += 1;
        continue;
      }

      const unitCost = costMap.get(item.productId);
      if (unitCost === undefined || unitCost === null) {
        totalWithoutCost += 1;
        continue;
      }

      if (options.apply) {
        const result = await prisma.documentItem.updateMany({
          where: {
            id: item.id,
            unitCost: null,
          },
          data: {
            unitCost,
          },
        });

        totalUpdated += result.count;
      } else {
        totalUpdated += 1;
      }
    }

    console.log(`Procesados: ${totalScanned} | Candidatos actualizables: ${totalUpdated}`);
  }

  console.log('\n=== Resumen ===');
  console.log(`Items escaneados: ${totalScanned}`);
  console.log(`${options.apply ? 'Items actualizados' : 'Items actualizables'}: ${totalUpdated}`);
  console.log(`Items sin productId: ${totalWithoutProduct}`);
  console.log(`Items sin costo en producto: ${totalWithoutCost}`);

  if (!options.apply) {
    console.log('\nEjecuta con --apply para persistir cambios.');
  }
}

main()
  .catch((error) => {
    console.error('Error en backfill unitCost:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
