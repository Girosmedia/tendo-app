import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { TeamList } from './_components/team-list';
import { TeamHeader } from './_components/team-header';
import { type TeamRole } from '@/lib/utils/team-permissions';

async function getTeamMembers() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/team/members`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
  });

  if (!response.ok) {
    console.error('Error fetching team members:', response.statusText);
    return [];
  }

  const data = await response.json();
  return data.members || [];
}

async function getInvitations() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/team/invitations`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
  });

  if (!response.ok) {
    console.error('Error fetching invitations:', response.statusText);
    return [];
  }

  const data = await response.json();
  return data.invitations || [];
}

export const metadata = {
  title: 'Gestión de Equipo | Tendo',
  description: 'Administra los miembros de tu equipo',
};

export default async function TeamPage() {
  const session = await auth();

  if (!session?.user?.organizationId) {
    redirect('/login');
  }

  const [members, invitations] = await Promise.all([
    getTeamMembers(),
    getInvitations(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <TeamHeader currentUserRole={(session.user.memberRole as TeamRole | null) ?? null} />
      <TeamList
        members={members}
        invitations={invitations}
        currentUserId={session.user.id}
        currentUserRole={(session.user.memberRole as TeamRole | null) ?? null}
      />
    </div>
  );
}
