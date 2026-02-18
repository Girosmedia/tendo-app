'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MoreHorizontal, Pencil, Trash2, Shield } from 'lucide-react'
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
import { EditUserSheet } from './edit-user-sheet'

interface Organization {
  id: string
  name: string
  slug: string
  role: string
}

interface User {
  id: string
  name: string | null
  email: string
  isSuperAdmin: boolean
  organizations: Organization[]
  membershipCount: number
  createdAt: Date
}

interface UsersTableProps {
  users: User[]
}

export function UsersTable({ users }: UsersTableProps) {
  const router = useRouter()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setIsEditOpen(true)
  }

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`¿Estás seguro de eliminar el usuario ${email}? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Usuario eliminado correctamente')
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al eliminar el usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar el usuario')
    }
  }

  return (
    <>
      {users.length === 0 ? (
        <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
          No hay usuarios registrados.
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {users.map((user) => (
              <Card key={user.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{user.email}</p>
                      {user.isSuperAdmin && <Shield className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.name || '-'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Rol</p>
                      {user.isSuperAdmin ? (
                        <Badge variant="default">Super Admin</Badge>
                      ) : (
                        <Badge variant="secondary">Usuario</Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Membresías</p>
                      <p className="text-sm font-medium">{user.membershipCount}</p>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <p className="text-xs text-muted-foreground">Fecha de registro</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Organizaciones</p>
                    <div className="flex max-w-xs flex-wrap gap-1">
                      {user.organizations.length === 0 ? (
                        <span className="text-sm text-muted-foreground">Ninguna</span>
                      ) : (
                        user.organizations.slice(0, 2).map((org) => (
                          <Badge key={org.id} variant="outline" className="text-xs">
                            {org.name}
                          </Badge>
                        ))
                      )}
                      {user.organizations.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{user.organizations.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>

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
                      <DropdownMenuItem onClick={() => handleEdit(user)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(user.id, user.email)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden md:block">
            <ResponsiveTable className="rounded-md border">
              <div style={{ minWidth: '820px' }}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Organizaciones</TableHead>
                      <TableHead>Membresías</TableHead>
                      <TableHead>Fecha de Registro</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="max-w-[210px] truncate">{user.email}</span>
                            {user.isSuperAdmin && (
                              <Shield className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="max-w-[130px] truncate">{user.name || '-'}</span>
                        </TableCell>
                        <TableCell>
                          {user.isSuperAdmin ? (
                            <Badge variant="default">
                              Super Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Usuario</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex max-w-xs flex-wrap gap-1">
                            {user.organizations.length === 0 ? (
                              <span className="text-sm text-muted-foreground">Ninguna</span>
                            ) : (
                              <>
                                <Badge variant="outline" className="text-xs">
                                  {user.organizations[0]?.name}
                                </Badge>
                                {user.organizations.length > 1 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{user.organizations.length - 1}
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{user.membershipCount}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString('es-CL')}
                        </TableCell>
                        <TableCell className="text-right">
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
                              <DropdownMenuItem onClick={() => handleEdit(user)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(user.id, user.email)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {selectedUser && (
        <EditUserSheet
          user={selectedUser}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
        />
      )}
    </>
  )
}
