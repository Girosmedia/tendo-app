import { PrismaClient } from '@/lib/generated/prisma/client/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Singleton pattern para evitar múltiples instancias de Prisma en desarrollo
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// Pool de conexiones PostgreSQL para el adaptador de Prisma 7
const pool = globalForPrisma.pool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.pool = pool;
}

// Adaptador de PostgreSQL para Prisma 7
const adapter = new PrismaPg(pool);

// Cliente de Prisma con adaptador
export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

// Alias para compatibilidad
export const prisma = db;

// En desarrollo, guardar la instancia en global para reutilizarla
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
