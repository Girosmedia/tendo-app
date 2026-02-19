'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface Organization {
  id: string
  name: string
  slug: string
  role: string
}

interface TenantOption {
  id: string
  name: string
}

interface UserMembership {
  id: string
  organizationId: string
}

interface MembershipManagerProps {
  userId: string
  organizations: Organization[]
}

export function MembershipManager({ userId, organizations }: MembershipManagerProps) {
  const router = useRouter()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [allOrganizations, setAllOrganizations] = useState<TenantOption[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<string>('MEMBER')
  const [membershipToRemove, setMembershipToRemove] = useState<Organization | null>(null)

  // Cargar todas las organizaciones para el selector
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const cookieHeader = document.cookie
        const response = await fetch('/api/admin/tenants', {
          headers: { Cookie: cookieHeader },
        })
        const data = await response.json()
        setAllOrganizations(data.tenants || [])
      } catch (error) {
        console.error('Error al cargar organizaciones:', error)
      }
    }

    if (isAddDialogOpen) {
      fetchOrganizations()
    }
  }, [isAddDialogOpen])

  const handleAddMembership = async () => {
    if (!selectedOrgId) {
      toast.error('Selecciona una organización')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          organizationId: selectedOrgId,
          role: selectedRole,
        }),
      })

      if (response.ok) {
        toast.success('Usuario agregado a la organización')
        setIsAddDialogOpen(false)
        setSelectedOrgId('')
        setSelectedRole('MEMBER')
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al agregar membresía')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al agregar membresía')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMembership = async () => {
    if (!membershipToRemove) return
    setIsRemoving(true)
    try {
      // Necesitamos el ID de la membresía, lo buscaremos
      const response = await fetch(`/api/admin/users/${userId}`)
      const userData = await response.json()
      
      const membership = userData.user?.memberships?.find(
        (membershipItem: UserMembership) => membershipItem.organizationId === membershipToRemove.id
      )

      if (!membership) {
        toast.error('Membresía no encontrada')
        return
      }

      const deleteResponse = await fetch(`/api/admin/memberships/${membership.id}`, {
        method: 'DELETE',
      })

      if (deleteResponse.ok) {
        toast.success('Usuario removido de la organización')
        router.refresh()
      } else {
        const error = await deleteResponse.json()
        toast.error(error.error || 'Error al eliminar membresía')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar membresía')
    } finally {
      setIsRemoving(false)
      setMembershipToRemove(null)
    }
  }

  // Filtrar organizaciones que el usuario aún no tiene
  const availableOrganizations = allOrganizations.filter(
    (org) => !organizations.some((userOrg) => userOrg.id === org.id)
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Organizaciones</Label>
        <Button size="sm" variant="outline" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
        <ResponsiveDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <ResponsiveDialogContent>
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>Agregar a Organización</ResponsiveDialogTitle>
              <ResponsiveDialogDescription>
                Asigna al usuario a una organización existente
              </ResponsiveDialogDescription>
            </ResponsiveDialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Organización</Label>
                <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar organización" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOrganizations.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No hay organizaciones disponibles
                      </div>
                    ) : (
                      availableOrganizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Miembro</SelectItem>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="OWNER">Propietario</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddMembership} disabled={isLoading}>
                {isLoading ? 'Agregando...' : 'Agregar'}
              </Button>
            </div>
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      </div>

      <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
        {organizations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pertenece a ninguna organización
          </p>
        ) : (
          organizations.map((org) => (
            <div
              key={org.id}
              className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-background"
            >
              <div className="flex items-center gap-2 flex-1">
                <Badge variant="outline">{org.name}</Badge>
                <Badge variant="secondary" className="text-xs">
                  {org.role}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMembershipToRemove(org)}
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!membershipToRemove}
        onOpenChange={(open) => {
          if (!open) setMembershipToRemove(null)
        }}
        onConfirm={handleRemoveMembership}
        title="Eliminar membresía"
        description={
          membershipToRemove
            ? `Se eliminará al usuario de la organización \"${membershipToRemove.name}\".`
            : 'Esta acción no se puede deshacer.'
        }
        confirmLabel="Eliminar"
        isLoading={isRemoving}
      />
    </div>
  )
}
