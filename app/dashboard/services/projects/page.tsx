import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ProjectsHeader } from './_components/projects-header';
import { ProjectsTable } from './_components/projects-table';
import { ServicesAlertsPanel } from './_components/services-alerts-panel';

async function getProjects() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/services/projects`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
  });

  if (!response.ok) {
    console.error('Error fetching projects:', response.statusText);
    return [];
  }

  const data = await response.json();
  return data.projects || [];
}

export const metadata = {
  title: 'Proyectos | Tendo',
  description: 'Gestión de proyectos activos',
};

export default async function ProjectsPage() {
  const session = await auth();

  if (!session?.user?.organizationId) {
    redirect('/login');
  }

  const projects = await getProjects();

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const alertsResponse = await fetch(`${baseUrl}/api/services/alerts`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
  });

  const alertsData = alertsResponse.ok ? await alertsResponse.json() : null;

  return (
    <div className="flex flex-col gap-6">
      <ProjectsHeader />
      <ServicesAlertsPanel alertsData={alertsData} />
      <ProjectsTable projects={projects} />
    </div>
  );
}
