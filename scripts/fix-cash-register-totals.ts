/**
 * Script para recalcular totales de cajas registradoras
 * 
 * Después de corregir los documentos, necesitamos actualizar:
 * - totalSales: suma de todos los documentos PAID
 * - expectedCash: openingCash + suma de documentos PAID en efectivo
 * - difference: actualCash - expectedCash (solo si ya está cerrada)
 * 
 * Uso: npx tsx scripts/fix-cash-register-totals.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@/lib/generated/prisma/client/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔍 Recalculando totales de cajas registradoras...\n');

  const cashRegisters = await prisma.cashRegister.findMany({
    orderBy: {
      openedAt: 'desc',
    },
  });

  console.log(`📦 Encontradas ${cashRegisters.length} cajas\n`);

  let updatedCount = 0;

  for (const caja of cashRegisters) {
    const startDate = caja.openedAt;
    const endDate = caja.closedAt || new Date();

    // Obtener todas las ventas en el período
    const [allSalesData, cashSalesData] = await Promise.all([
      prisma.document.aggregate({
        where: {
          organizationId: caja.organizationId,
          createdBy: caja.openedBy,
          status: 'PAID',
          issuedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          total: true,
        },
        _count: true,
      }),
      prisma.document.aggregate({
        where: {
          organizationId: caja.organizationId,
          createdBy: caja.openedBy,
          status: 'PAID',
          paymentMethod: 'CASH',
          issuedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          total: true,
        },
      }),
    ]);

    const salesCount = allSalesData._count || 0;
    const totalSales = Number(allSalesData._sum.total || 0);
    const totalCashSales = Number(cashSalesData._sum.total || 0);
    const expectedCash = Number(caja.openingCash) + totalCashSales;

    // Calcular nueva diferencia si está cerrada
    let newDifference = caja.difference ? Number(caja.difference) : null;
    if (caja.status === 'CLOSED' && caja.actualCash !== null) {
      newDifference = Number(caja.actualCash) - expectedCash;
    }

    // Verificar si necesita actualización
    const currentSalesCount = caja.salesCount || 0;
    const currentTotalSales = Number(caja.totalSales);
    const currentExpectedCash = Number(caja.expectedCash);

    const needsUpdate = 
      salesCount !== currentSalesCount ||
      Math.abs(totalSales - currentTotalSales) > 1 ||
      Math.abs(expectedCash - currentExpectedCash) > 1;

    if (needsUpdate) {
      console.log(`🔧 Caja ID: ${caja.id.substring(0, 8)}... (${caja.status})`);
      console.log(`   Abierta: ${caja.openedAt.toLocaleString('es-CL')}`);
      console.log(`   ❌ Valores actuales:`);
      console.log(`      Ventas: ${currentSalesCount}, Total: $${currentTotalSales.toLocaleString('es-CL')}, Esperado: $${currentExpectedCash.toLocaleString('es-CL')}`);
      console.log(`   ✅ Valores correctos:`);
      console.log(`      Ventas: ${salesCount}, Total: $${totalSales.toLocaleString('es-CL')}, Esperado: $${expectedCash.toLocaleString('es-CL')}`);

      const updateData: any = {
        salesCount,
        totalSales,
        expectedCash,
      };

      if (newDifference !== null) {
        updateData.difference = newDifference;
        console.log(`      Diferencia: $${newDifference.toLocaleString('es-CL')}`);
      }

      await prisma.cashRegister.update({
        where: { id: caja.id },
        data: updateData,
      });

      console.log(`   ✅ Actualizada\n`);
      updatedCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN:');
  console.log(`   ✅ Cajas actualizadas: ${updatedCount}`);
  console.log(`   ⏭️  Cajas sin cambios: ${cashRegisters.length - updatedCount}`);
  console.log(`   📦 Total procesadas: ${cashRegisters.length}`);
  console.log('='.repeat(60) + '\n');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
