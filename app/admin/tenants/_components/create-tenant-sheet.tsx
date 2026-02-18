'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

const AVAILABLE_MODULES = [
  { id: 'POS', label: 'Punto de Venta' },
  { id: 'INVENTORY', label: 'Inventario' },
  { id: 'FINANCE', label: 'Finanzas (Mi Caja)' },
  { id: 'QUOTES', label: 'Cotizaciones' },
  { id: 'PROJECTS', label: 'Proyectos' },
  { id: 'CRM', label: 'Fiados (CRM)' },
]

const createTenantSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  rut: z.string().min(8, 'RUT inválido'),
  ownerEmail: z.string().email('Email inválido'),
  ownerName: z.string().optional(),
  plan: z.enum(['BASIC', 'PRO', 'ENTERPRISE'] as const),
  status: z.enum(['ACTIVE', 'TRIAL', 'SUSPENDED'] as const),
  modules: z.array(z.string()),
})

type CreateTenantFormData = z.infer<typeof createTenantSchema>

interface CreateTenantSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTenantSheet({ open, onOpenChange }: CreateTenantSheetProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CreateTenantFormData>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: '',
      rut: '',
      ownerEmail: '',
      ownerName: '',
      plan: 'BASIC',
      status: 'ACTIVE',
      modules: [],
    },
  })

  const onSubmit = async (data: CreateTenantFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success('Tenant creado correctamente')
        form.reset()
        onOpenChange(false)
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al crear el tenant')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al crear el tenant')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[540px] overflow-y-auto">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Crear Nuevo Tenant</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Crear una organización manualmente desde el panel de administración
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
            {/* Nombre */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Organización</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Mi Empresa S.A." {...field} />
                  </FormControl>
                  <FormDescription>
                    El nombre completo de la organización
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* RUT */}
            <FormField
              control={form.control}
              name="rut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RUT</FormLabel>
                  <FormControl>
                    <Input placeholder="12.345.678-9" {...field} />
                  </FormControl>
                  <FormDescription>
                    RUT de la empresa (será validado y formateado)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Separador */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-4">Propietario del Tenant</h4>
            </div>

            {/* Email del Owner */}
            <FormField
              control={form.control}
              name="ownerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email del Propietario</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="propietario@empresa.cl" {...field} />
                  </FormControl>
                  <FormDescription>
                    Si el email ya existe, se asociará al tenant. Si no existe, se creará un usuario nuevo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nombre del Owner (opcional) */}
            <FormField
              control={form.control}
              name="ownerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Propietario (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Pérez" {...field} />
                  </FormControl>
                  <FormDescription>
                    Solo se usa si el usuario no existe. Puede dejarlo vacío
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Separador */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-4">Configuración del Tenant</h4>
            </div>

            {/* Estado */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Activo</SelectItem>
                      <SelectItem value="TRIAL">Prueba</SelectItem>
                      <SelectItem value="SUSPENDED">Suspendido</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Estado inicial de la organización
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Plan */}
            <FormField
              control={form.control}
              name="plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BASIC">Básico (Gratis)</SelectItem>
                      <SelectItem value="PRO">Pro</SelectItem>
                      <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Plan de suscripción del tenant
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Módulos */}
            <FormField
              control={form.control}
              name="modules"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Módulos Activos</FormLabel>
                    <FormDescription>
                      Selecciona los módulos que estarán disponibles para este tenant
                    </FormDescription>
                  </div>
                  <div className="rounded-lg border p-4 space-y-3">
                    {AVAILABLE_MODULES.map((module) => (
                      <FormField
                        key={module.id}
                        control={form.control}
                        name="modules"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={module.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(module.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, module.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== module.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {module.label}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botones */}
            <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset()
                  onOpenChange(false)
                }}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creando...' : 'Crear Tenant'}
              </Button>
            </div>
          </form>
        </Form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
