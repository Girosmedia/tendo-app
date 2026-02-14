import { PrismaClient } from '@/lib/generated/prisma/client/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function cleanup() {
  console.log('🧹 Limpiando datos de prueba...');
  
  // Resetear currentOrganizationId de todos los usuarios
  await prisma.user.updateMany({
    data: { currentOrganizationId: null },
  });
  console.log('✓ currentOrganizationId reseteado');
  
  // Eliminar todas las membresías
  await prisma.member.deleteMany({});
  console.log('✓ Membresías eliminadas');
  
  // Eliminar todas las organizaciones
  await prisma.organization.deleteMany({});
  console.log('✓ Organizaciones eliminadas');
  
  // Mostrar estado
  const userCount = await prisma.user.count();
  const orgCount = await prisma.organization.count();
  
  console.log('\n📊 Estado actual:');
  console.log(`   Usuarios: ${userCount}`);
  console.log(`   Organizaciones: ${orgCount}`);
  console.log('\n✅ Limpieza completada');
  
  await prisma.$disconnect();
  pool.end();
}

cleanup().catch((error) => {
  console.error('Error en limpieza:', error);
  process.exit(1);
});
