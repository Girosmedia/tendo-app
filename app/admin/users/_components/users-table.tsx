'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MoreHorizontal, Pencil, Trash2, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
      <div className="rounded-md border">
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
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No hay usuarios registrados.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.email}
                      {user.isSuperAdmin && (
                        <Shield className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{user.name || '-'}</TableCell>
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
                    <div className="flex flex-wrap gap-1 max-w-xs">
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
