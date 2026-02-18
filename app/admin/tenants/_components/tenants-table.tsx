'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EditTenantSheet } from './edit-tenant-sheet'
import { ImpersonateButton } from './impersonate-button'

interface Tenant {
  id: string
  name: string
  slug: string
  rut: string
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL'
  plan: string
  modules: string[]
  owner: {
    id: string
    name: string | null
    email: string | null
  } | null
  membersCount: number
  createdAt: Date
}

interface TenantsTableProps {
  tenants: Tenant[]
}

const statusVariants = {
  ACTIVE: { label: 'Activo', variant: 'default' as const },
  SUSPENDED: { label: 'Suspendido', variant: 'destructive' as const },
  TRIAL: { label: 'Prueba', variant: 'secondary' as const },
}

export function TenantsTable({ tenants }: TenantsTableProps) {
  const router = useRouter()
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const handleEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setIsEditOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este tenant? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/tenants/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Tenant eliminado correctamente')
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al eliminar el tenant')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar el tenant')
    }
  }

  return (
    <>
      {tenants.length === 0 ? (
        <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
          No hay tenants registrados.
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {tenants.map((tenant) => (
              <Card key={tenant.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">{tenant.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{tenant.slug}</p>
                    </div>
                    <Badge variant={statusVariants[tenant.status].variant}>
                      {statusVariants[tenant.status].label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">RUT</p>
                      <p className="font-mono text-xs">{tenant.rut}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Plan</p>
                      <Badge variant="outline">{tenant.plan}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Miembros</p>
                      <p className="font-medium">{tenant.membersCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Propietario</p>
                      <p className="truncate text-sm">{tenant.owner?.name || 'Sin propietario'}</p>
                      <p className="truncate text-xs text-muted-foreground">{tenant.owner?.email || '-'}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Módulos</p>
                    <div className="flex flex-wrap gap-1">
                      {tenant.modules.length === 0 ? (
                        <span className="text-xs text-muted-foreground">Ninguno</span>
                      ) : (
                        tenant.modules.map((module) => (
                          <Badge key={module} variant="secondary" className="text-xs">
                            {module}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ImpersonateButton 
                      organizationId={tenant.id}
                      organizationName={tenant.name}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-11">
                          <MoreHorizontal className="mr-2 h-4 w-4" />
                          Acciones
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEdit(tenant)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(tenant.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden md:block">
            <ResponsiveTable className="rounded-md border">
              <div style={{ minWidth: '900px' }}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>RUT</TableHead>
                      <TableHead>Propietario</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Miembros</TableHead>
                      <TableHead>Módulos</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">
                          <p className="max-w-[180px] truncate">{tenant.name}</p>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <p className="max-w-[160px] truncate">{tenant.slug}</p>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{tenant.rut}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="max-w-[170px] truncate text-sm">{tenant.owner?.name || 'Sin propietario'}</span>
                            <span className="max-w-[170px] truncate text-xs text-muted-foreground">{tenant.owner?.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariants[tenant.status].variant}>
                            {statusVariants[tenant.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tenant.plan}</Badge>
                        </TableCell>
                        <TableCell className="text-center">{tenant.membersCount}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {tenant.modules.length === 0 ? (
                              <span className="text-xs text-muted-foreground">Ninguno</span>
                            ) : (
                              <>
                                <Badge variant="secondary" className="text-xs">
                                  {tenant.modules[0]}
                                </Badge>
                                {tenant.modules.length > 1 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{tenant.modules.length - 1}
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <ImpersonateButton 
                              organizationId={tenant.id}
                              organizationName={tenant.name}
                              compact
                            />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menú</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleEdit(tenant)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(tenant.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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

      {selectedTenant && (
        <EditTenantSheet
          tenant={selectedTenant}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
        />
      )}
    </>
  )
}
