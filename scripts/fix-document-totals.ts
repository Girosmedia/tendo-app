/**
 * Script para corregir totales de documentos con cálculo incorrecto de IVA
 * 
 * PROBLEMA: Los documentos antiguos calculaban IVA dos veces:
 * - subtotal = qty * precio, taxAmount = subtotal * 0.19, total = subtotal + tax
 * 
 * CORRECCIÓN: El precio es BRUTO (incluye IVA):
 * - total = qty * precio, neto = total / 1.19, iva = total - neto
 * 
 * Uso: npx tsx scripts/fix-document-totals.ts
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
  console.log('🔍 Buscando documentos con cálculos incorrectos...\n');

  // Obtener todos los documentos con sus items
  const documents = await prisma.document.findMany({
    include: {
      items: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`📄 Encontrados ${documents.length} documentos\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const doc of documents) {
    let needsUpdate = false;
    const updatedItems: any[] = [];

    // Recalcular cada item
    for (const item of doc.items) {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const discount = Number(item.discount);
      const taxRate = Number(item.taxRate);

      // Calcular correcto desde precio BRUTO
      const totalBruto = quantity * unitPrice - discount;
      const divisor = 1 + (taxRate / 100);
      const subtotalCorrecto = totalBruto / divisor; // Neto
      const taxAmountCorrecto = totalBruto - subtotalCorrecto; // IVA
      const totalCorrecto = totalBruto;

      // Comparar con valores actuales
      const subtotalActual = Number(item.subtotal);
      const taxAmountActual = Number(item.taxAmount);
      const totalActual = Number(item.total);

      // Si hay diferencia significativa (más de $1)
      const diffSubtotal = Math.abs(subtotalCorrecto - subtotalActual);
      const diffTax = Math.abs(taxAmountCorrecto - taxAmountActual);
      const diffTotal = Math.abs(totalCorrecto - totalActual);

      if (diffSubtotal > 1 || diffTax > 1 || diffTotal > 1) {
        needsUpdate = true;
        updatedItems.push({
          id: item.id,
          subtotal: subtotalCorrecto,
          taxAmount: taxAmountCorrecto,
          total: totalCorrecto,
        });

        console.log(`  📝 Item "${item.name}" (${item.sku})`);
        console.log(`     Cantidad: ${quantity} × $${unitPrice.toLocaleString('es-CL')}`);
        console.log(`     ❌ Valores incorrectos: Neto=$${subtotalActual.toLocaleString('es-CL')} IVA=$${taxAmountActual.toLocaleString('es-CL')} Total=$${totalActual.toLocaleString('es-CL')}`);
        console.log(`     ✅ Valores correctos:   Neto=$${Math.round(subtotalCorrecto).toLocaleString('es-CL')} IVA=$${Math.round(taxAmountCorrecto).toLocaleString('es-CL')} Total=$${Math.round(totalCorrecto).toLocaleString('es-CL')}`);
      }
    }

    if (needsUpdate) {
      console.log(`\n🔧 Actualizando documento ${doc.docNumber}...`);

      // Actualizar cada item
      for (const item of updatedItems) {
        await prisma.documentItem.update({
          where: { id: item.id },
          data: {
            subtotal: item.subtotal,
            taxAmount: item.taxAmount,
            total: item.total,
          },
        });
      }

      // Recalcular totales del documento
      const newSubtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
      const newTaxAmount = updatedItems.reduce((sum, item) => sum + item.taxAmount, 0);
      const newTotal = newSubtotal + newTaxAmount - Number(doc.discount);

      // Actualizar documento
      await prisma.document.update({
        where: { id: doc.id },
        data: {
          subtotal: newSubtotal,
          taxAmount: newTaxAmount,
          total: newTotal,
        },
      });

      console.log(`✅ Documento ${doc.docNumber} actualizado`);
      console.log(`   Nuevo total: $${Math.round(newTotal).toLocaleString('es-CL')}\n`);
      
      updatedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN:');
  console.log(`   ✅ Documentos actualizados: ${updatedCount}`);
  console.log(`   ⏭️  Documentos sin cambios: ${skippedCount}`);
  console.log(`   📄 Total procesados: ${documents.length}`);
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
