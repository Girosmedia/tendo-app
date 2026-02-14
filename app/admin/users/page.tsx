import { cookies } from 'next/headers'
import { UsersTable } from './_components/users-table'

async function getUsers() {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ')

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const response = await fetch(`${baseUrl}/api/admin/users`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader,
    },
  })

  if (!response.ok) {
    console.error('Error fetching users:', response.statusText)
    return []
  }

  const data = await response.json()
  return data.users || []
}

export default async function UsersPage() {
  const users = await getUsers()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
        <p className="text-muted-foreground">
          Administra todos los usuarios registrados en el sistema
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Todos los Usuarios</h3>
            <p className="text-sm text-muted-foreground">
              {users.length} usuarios registrados
            </p>
          </div>
        </div>

        <UsersTable users={users} />
      </div>
    </div>
  )
}
