'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { MembershipManager } from './membership-manager'

const updateUserSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  isSuperAdmin: z.boolean(),
})

type UpdateUserFormData = z.infer<typeof updateUserSchema>

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
}

interface EditUserSheetProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditUserSheet({ user, open, onOpenChange }: EditUserSheetProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: user.name || '',
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
    },
  })

  const onSubmit = async (data: UpdateUserFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success('Usuario actualizado correctamente')
        onOpenChange(false)
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al actualizar el usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar el usuario')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Usuario</SheetTitle>
          <SheetDescription>
            Modificar información de <strong>{user.email}</strong>
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
            {/* Gestión de Membresías */}
            <MembershipManager userId={user.id} organizations={user.organizations} />

            {/* Nombre */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="usuario@ejemplo.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    El email debe ser único en el sistema
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Super Admin */}
            <FormField
              control={form.control}
              name="isSuperAdmin"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Super Administrador</FormLabel>
                    <FormDescription>
                      Los super admins tienen acceso completo al panel de administración
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
