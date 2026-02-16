import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { QuotesHeader } from './_components/quotes-header';
import { QuotesTable } from './_components/quotes-table';

async function getQuotes() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/services/quotes`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
  });

  if (!response.ok) {
    console.error('Error fetching quotes:', response.statusText);
    return [];
  }

  const data = await response.json();
  return data.quotes || [];
}

export const metadata = {
  title: 'Cotizaciones | Tendo',
  description: 'Gestión de cotizaciones de servicios',
};

export default async function QuotesPage() {
  const session = await auth();

  if (!session?.user?.organizationId) {
    redirect('/login');
  }

  const quotes = await getQuotes();

  return (
    <div className="flex flex-col gap-6">
      <QuotesHeader />
      <QuotesTable quotes={quotes} />
    </div>
  );
}
