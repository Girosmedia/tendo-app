'use client'

import { Badge } from '@/components/ui/badge'
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
    <div className="rounded-md border">
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
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No hay registros de auditoría.
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString('es-CL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {log.user?.name || 'Usuario desconocido'}
                    </span>
                    <span className="text-xs text-muted-foreground">
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
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    {log.resourceId.substring(0, 8)}...
                  </code>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {log.ipAddress || '-'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
