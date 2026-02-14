'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

interface Tenant {
  id: string
  name: string
  slug: string
  rut: string
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL'
  plan: string
  modules: string[]
}

interface EditTenantSheetProps {
  tenant: Tenant
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AVAILABLE_MODULES = [
  { id: 'POS', label: 'Punto de Venta' },
  { id: 'INVENTORY', label: 'Inventario' },
  { id: 'FINANCE', label: 'Finanzas (Mi Caja)' },
  { id: 'QUOTES', label: 'Cotizaciones' },
  { id: 'PROJECTS', label: 'Proyectos' },
  { id: 'CRM', label: 'Fiados (CRM)' },
]

export function EditTenantSheet({ tenant, open, onOpenChange }: EditTenantSheetProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<string>(tenant.status)
  const [plan, setPlan] = useState<string>(tenant.plan)
  const [selectedModules, setSelectedModules] = useState<string[]>(tenant.modules)

  const handleModuleToggle = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          plan,
          modules: selectedModules,
        }),
      })

      if (response.ok) {
        toast.success('Tenant actualizado correctamente')
        onOpenChange(false)
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al actualizar el tenant')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar el tenant')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>Editar Tenant</SheetTitle>
          <SheetDescription>
            Modificar la configuración de <strong>{tenant.name}</strong>
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Información básica (solo lectura) */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Información</Label>
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="font-medium">Nombre:</span>
                <span>{tenant.name}</span>
                <span className="font-medium">Slug:</span>
                <span className="font-mono text-xs">{tenant.slug}</span>
                <span className="font-medium">RUT:</span>
                <span className="font-mono text-xs">{tenant.rut}</span>
              </div>
            </div>
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Activo</SelectItem>
                <SelectItem value="TRIAL">Prueba</SelectItem>
                <SelectItem value="SUSPENDED">Suspendido</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Los tenants suspendidos no pueden acceder al sistema
            </p>
          </div>

          {/* Plan */}
          <div className="space-y-2">
            <Label htmlFor="plan">Plan</Label>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger id="plan">
                <SelectValue placeholder="Seleccionar plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BASIC">Básico (Gratis)</SelectItem>
                <SelectItem value="PRO">Pro</SelectItem>
                <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Módulos activos */}
          <div className="space-y-3">
            <Label>Módulos Activos</Label>
            <div className="rounded-lg border p-4 space-y-3">
              {AVAILABLE_MODULES.map((module) => (
                <div key={module.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={module.id}
                    checked={selectedModules.includes(module.id)}
                    onCheckedChange={() => handleModuleToggle(module.id)}
                  />
                  <label
                    htmlFor={module.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {module.label}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Solo los módulos marcados estarán disponibles para este tenant
            </p>
          </div>

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
      </SheetContent>
    </Sheet>
  )
}
