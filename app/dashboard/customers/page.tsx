import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { CustomersHeader } from './_components/customers-header';
import { CustomersTable } from './_components/customers-table';

async function getCustomers() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/customers`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
  });

  if (!response.ok) {
    console.error('Error fetching customers:', response.statusText);
    return [];
  }

  const data = await response.json();
  return data.customers || [];
}

export const metadata = {
  title: 'Clientes | Tendo',
  description: 'Gestión de clientes',
};

export default async function CustomersPage() {
  const session = await auth();

  if (!session?.user?.organizationId) {
    redirect('/login');
  }

  const customers = await getCustomers();

  return (
    <div className="flex flex-col gap-6">
      <CustomersHeader />
      <CustomersTable customers={customers} />
    </div>
  );
}
