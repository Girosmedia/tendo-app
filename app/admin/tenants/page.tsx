import { cookies } from 'next/headers'
import { TenantsTable } from './_components/tenants-table'
import { CreateTenantButton } from './_components/create-tenant-button'

async function getTenants() {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ')

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const response = await fetch(`${baseUrl}/api/admin/tenants`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader,
    },
  })

  if (!response.ok) {
    console.error('Error fetching tenants:', response.statusText)
    return []
  }

  const data = await response.json()
  return data.tenants || []
}

export default async function TenantsPage() {
  const tenants = await getTenants()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Tenants</h2>
        <p className="text-muted-foreground">
          Administra todas las organizaciones registradas en el sistema
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Todos los Tenants</h3>
            <p className="text-sm text-muted-foreground">
              {tenants.length} organizaciones registradas
            </p>
          </div>
          <CreateTenantButton />
        </div>

        <TenantsTable tenants={tenants} />
      </div>
    </div>
  )
}
