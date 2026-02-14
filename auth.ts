import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { db } from '@/lib/db';
import authConfig from '@/auth.config';

// Schema de validación para login
const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        // Validar credenciales con Zod
        const validatedFields = loginSchema.safeParse(credentials);

        if (!validatedFields.success) {
          return null;
        }

        const { email, password } = validatedFields.data;

        // Buscar usuario por email
        const user = await db.user.findUnique({
          where: { email },
        });

        // Si no existe el usuario o no tiene password, rechazar
        if (!user || !user.password) {
          return null;
        }

        // Verificar la contraseña
        const passwordsMatch = await bcrypt.compare(password, user.password);

        if (!passwordsMatch) {
          return null;
        }

        // Retornar usuario autenticado
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // En el login inicial, agregar datos del usuario al token
      if (user && user.id) {
        token.id = user.id;
        
        // Obtener la organización actual y el estado de super admin
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { 
            currentOrganizationId: true,
            isSuperAdmin: true,
          },
        });
        
        token.organizationId = dbUser?.currentOrganizationId ?? null;
        token.isSuperAdmin = dbUser?.isSuperAdmin ?? false;
      }
      
      // Si hay un update manual de la sesión O si el token no tiene organizationId
      // verificar en BD (esto cubre el caso de crear org)
      if (trigger === 'update' || !token.organizationId) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { 
            currentOrganizationId: true,
            isSuperAdmin: true,
          },
        });
        
        if (dbUser?.currentOrganizationId) {
          token.organizationId = dbUser.currentOrganizationId;
        }
        if (dbUser?.isSuperAdmin !== undefined) {
          token.isSuperAdmin = dbUser.isSuperAdmin;
        }
      }

      // Verificar si hay sesión de impersonation activa (solo para super admins)
      if (token.isSuperAdmin) {
        // Buscar la sesión de impersonation más reciente activa
        const activeImpersonation = await db.impersonationSession.findFirst({
          where: {
            superAdminId: token.id as string,
            isActive: true,
            expiresAt: {
              gt: new Date(),
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (activeImpersonation) {
          // Activar modo impersonation
          token.impersonationSessionId = activeImpersonation.id;
          token.organizationId = activeImpersonation.targetOrganizationId;
        } else if (token.impersonationSessionId) {
          // Limpiar impersonation si ya no está activa
          delete token.impersonationSessionId;
          // Resetear a la org original del super admin (null típicamente)
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: { currentOrganizationId: true },
          });
          token.organizationId = dbUser?.currentOrganizationId ?? null;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      // Agregar datos del token a la sesión
      if (session.user) {
        session.user.id = token.id as string;
        session.user.organizationId = token.organizationId as string | null;
        session.user.isSuperAdmin = token.isSuperAdmin as boolean;
        session.user.impersonationSessionId = token.impersonationSessionId as string | undefined;
      }
      
      return session;
    },
  },
});
