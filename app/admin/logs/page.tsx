import { cookies } from 'next/headers'
import { AuditLogTable } from './_components/audit-log-table'

async function getLogs() {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ')

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const response = await fetch(`${baseUrl}/api/admin/logs`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader,
    },
  })

  if (!response.ok) {
    console.error('Error fetching logs:', response.statusText)
    return []
  }

  const data = await response.json()
  return data.logs || []
}

export default async function LogsPage() {
  const logs = await getLogs()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Registro de Auditorías</h2>
        <p className="text-muted-foreground">
          Historial de acciones administrativas en el sistema
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Últimas Acciones</h3>
            <p className="text-sm text-muted-foreground">
              {logs.length} registros ({logs.length === 100 ? 'mostrando últimos 100' : 'todos'})
            </p>
          </div>
        </div>

        <AuditLogTable logs={logs} />
      </div>
    </div>
  )
}
