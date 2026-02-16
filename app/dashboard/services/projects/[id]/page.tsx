import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ProjectDetailView } from './_components/project-detail-view';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getProject(projectId: string) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/services/projects/${projectId}`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
  });

  if (!response.ok) {
    return null;
  }

  return await response.json();
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const session = await auth();

  if (!session?.user?.organizationId) {
    redirect('/login');
  }

  const { id } = await params;
  const projectData = await getProject(id);

  if (!projectData?.project) {
    redirect('/dashboard/services/projects');
  }

  return <ProjectDetailView projectData={projectData} />;
}
