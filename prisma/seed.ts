import { PrismaClient } from '../lib/generated/prisma/client/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configurar Pool y Adapter como en lib/db.ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Verificar si ya existe el super admin
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@tendo.cl' },
  });

  if (existingAdmin) {
    console.log('✅ Super admin ya existe: admin@tendo.cl');
    
    // Asegurar que tenga el flag de super admin
    if (!existingAdmin.isSuperAdmin) {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { isSuperAdmin: true },
      });
      console.log('✅ Flag isSuperAdmin actualizado');
    }
  } else {
    // Crear super admin inicial
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'admin@tendo.cl',
        password: hashedPassword,
        isSuperAdmin: true,
      },
    });

    console.log('✅ Super admin creado:', admin.email);
    console.log('📧 Email: admin@tendo.cl');
    console.log('🔑 Password: admin123');
    console.log('⚠️  IMPORTANTE: Cambiar este password en producción');
  }

  console.log('');
  console.log('🎉 Seed completado exitosamente!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error en seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
