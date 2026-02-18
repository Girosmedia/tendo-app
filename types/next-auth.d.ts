import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      organizationId: string | null;
      isSuperAdmin: boolean;
      impersonationSessionId?: string;
      jobTitle?: string | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    organizationId: string | null;
    isSuperAdmin: boolean;
    impersonationSessionId?: string;
    jobTitle?: string | null;
  }
}
