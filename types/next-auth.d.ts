import { DefaultSession } from 'next-auth';
import type { MemberRole } from '@/lib/generated/prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      organizationId: string | null;
      organizationStatus: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | null;
      isSuperAdmin: boolean;
      memberRole: MemberRole | null;
      enabledModules: string[];
      impersonationSessionId?: string;
      jobTitle?: string | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    organizationId: string | null;
    organizationStatus: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | null;
    isSuperAdmin: boolean;
    memberRole: MemberRole | null;
    enabledModules: string[];
    impersonationSessionId?: string;
    jobTitle?: string | null;
  }
}

