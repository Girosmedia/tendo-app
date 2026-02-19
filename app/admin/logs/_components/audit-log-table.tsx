'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ResponsiveTable } from '@/components/ui/responsive-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Shield, 
  Plus, 
  Pencil, 
  Trash2,
  User,
  Building2,
} from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'
import { EmptyState } from '@/components/ui/empty-state'

interface AuditLog {
  id: string
  userId: string
  user: {
    id: string
    name: string | null
    email: string
  } | null
  action: string
  resource: string
  resourceId: string
  changes: unknown
  ipAddress: string | null
  createdAt: Date
}

interface AuditLogTableProps {
  logs: AuditLog[]
}

const actionConfig: Record<string, { label: string; icon: typeof Plus; variant: 'default' | 'secondary' | 'destructive' }> = {
  CREATE_TENANT: { label: 'Crear Tenant', icon: Plus, variant: 'default' },
  UPDATE_TENANT: { label: 'Actualizar Tenant', icon: Pencil, variant: 'secondary' },
  DELETE_TENANT: { label: 'Eliminar Tenant', icon: Trash2, variant: 'destructive' },
  CREATE_USER: { label: 'Crear Usuario', icon: Plus, variant: 'default' },
  UPDATE_USER: { label: 'Actualizar Usuario', icon: Pencil, variant: 'secondary' },
  DELETE_USER: { label: 'Eliminar Usuario', icon: Trash2, variant: 'destructive' },
  IMPERSONATE_USER: { label: 'Impersonar Usuario', icon: Shield, variant: 'secondary' },
  STOP_IMPERSONATE: { label: 'Detener Impersonación', icon: Shield, variant: 'secondary' },
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  const formatAuditDateTime = (value: Date) => {
    return formatInTimeZone(new Date(value), 'America/Santiago', 'dd-MM-yyyy, HH:mm:ss')
  }

  const getActionIcon = (action: string) => {
    const config = actionConfig[action]
    if (!config) return null
    const Icon = config.icon
    return <Icon className="h-4 w-4" />
  }

  const getActionBadge = (action: string) => {
    const config = actionConfig[action] || { label: action, variant: 'secondary' as const }
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {getActionIcon(action)}
        {config.label}
      </Badge>
    )
  }

  const getResourceIcon = (resource: string) => {
    if (resource === 'Organization') return <Building2 className="h-4 w-4 text-muted-foreground" />
    if (resource === 'User') return <User className="h-4 w-4 text-muted-foreground" />
    return null
  }

  return (
    <>
      {logs.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No hay registros de auditoría"
          description="Cuando ocurran acciones administrativas, aparecerán listadas aquí."
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {logs.map((log) => (
              <Card key={log.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Fecha y hora</p>
                      <p className="text-sm font-medium">{formatAuditDateTime(log.createdAt)}</p>
                    </div>
                    {getActionBadge(log.action)}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Usuario</p>
                    <p className="text-sm font-medium">{log.user?.name || 'Usuario desconocido'}</p>
                    <p className="truncate text-xs text-muted-foreground">{log.user?.email || log.userId}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Recurso</p>
                      <div className="flex items-center gap-2">
                        {getResourceIcon(log.resource)}
                        <span className="text-sm">{log.resource}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">IP</p>
                      <p className="text-xs text-muted-foreground">{log.ipAddress || '-'}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">ID de recurso</p>
                    <code className="inline-flex rounded bg-muted px-1 py-0.5 text-xs">
                      {log.resourceId.substring(0, 8)}...
                    </code>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden md:block">
            <ResponsiveTable className="rounded-md border">
              <div style={{ minWidth: '760px' }}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha y Hora</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Recurso</TableHead>
                      <TableHead>ID de Recurso</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatAuditDateTime(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {log.user?.name || 'Usuario desconocido'}
                            </span>
                            <span className="max-w-[180px] truncate text-xs text-muted-foreground">
                              {log.user?.email || log.userId}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getResourceIcon(log.resource)}
                            <span className="text-sm">{log.resource}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="rounded bg-muted px-1 py-0.5 text-xs">
                            {log.resourceId.substring(0, 8)}...
                          </code>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.ipAddress || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ResponsiveTable>
          </div>
        </>
      )}
    </>
  )
}
