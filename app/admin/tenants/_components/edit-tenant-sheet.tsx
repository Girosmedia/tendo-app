'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  MODULE_ADMIN_SELECTION_ORDER,
  MODULE_CATALOG,
  TRACK_MODULE_MATRIX,
  inferTrackFromModules,
  type BusinessTrack,
  type ModuleKey,
} from '@/lib/constants/modules'

interface Tenant {
  id: string
  name: string
  slug: string
  rut: string
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL'
  plan: string
  modules: string[]
  businessTrack?: BusinessTrack
}

interface EditTenantSheetProps {
  tenant: Tenant
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AVAILABLE_MODULES = MODULE_ADMIN_SELECTION_ORDER.map((moduleId) => ({
  id: moduleId,
  label: MODULE_CATALOG[moduleId].label,
}))

export function EditTenantSheet({ tenant, open, onOpenChange }: EditTenantSheetProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<string>(tenant.status)
  const [plan, setPlan] = useState<string>(tenant.plan)
  const [businessTrack, setBusinessTrack] = useState<BusinessTrack>(
    tenant.businessTrack ?? inferTrackFromModules(tenant.modules)
  )
  const [selectedModules, setSelectedModules] = useState<string[]>(() => {
    const baseModules = new Set(TRACK_MODULE_MATRIX[tenant.businessTrack ?? inferTrackFromModules(tenant.modules)])
    return tenant.modules.filter((module) => !baseModules.has(module as ModuleKey))
  })

  const baseModules = TRACK_MODULE_MATRIX[businessTrack] ?? []

  const handleModuleToggle = (moduleId: string) => {
    if (baseModules.includes(moduleId as ModuleKey)) {
      return
    }

    setSelectedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  const handleTrackChange = (nextTrack: BusinessTrack) => {
    setBusinessTrack(nextTrack)
    const nextBase = new Set(TRACK_MODULE_MATRIX[nextTrack])
    setSelectedModules((prev) => prev.filter((module) => !nextBase.has(module as ModuleKey)))
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
          businessTrack,
          additionalModules: selectedModules,
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
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[540px] overflow-y-auto">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Editar Tenant</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Modificar la configuración de <strong>{tenant.name}</strong>
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

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
            <Select
              value={plan}
              onValueChange={(value) => {
                setPlan(value)
                if (value === 'BASIC' && businessTrack === 'MIXED') {
                  handleTrackChange('RETAIL')
                }
              }}
            >
              <SelectTrigger id="plan">
                <SelectValue placeholder="Seleccionar plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BASIC">Básico (Gratis)</SelectItem>
                <SelectItem value="PRO">Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="track">Track Base</Label>
            <Select
              value={businessTrack}
              onValueChange={(value) => {
                if (plan === 'BASIC' && value === 'MIXED') {
                  return
                }
                handleTrackChange(value as BusinessTrack)
              }}
            >
              <SelectTrigger id="track">
                <SelectValue placeholder="Seleccionar track" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RETAIL">Retail</SelectItem>
                <SelectItem value="SERVICES">Servicios</SelectItem>
                <SelectItem value="MIXED" disabled={plan === 'BASIC'}>
                  Mixto (Retail + Servicios)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Módulos activos */}
          <div className="space-y-3">
            <Label>Módulos Adicionales (Cross-sell)</Label>
            <div className="rounded-lg border p-4 space-y-3">
              {AVAILABLE_MODULES.map((module) => (
                <div key={module.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={module.id}
                    checked={baseModules.includes(module.id as ModuleKey) || selectedModules.includes(module.id)}
                    disabled={baseModules.includes(module.id as ModuleKey)}
                    onCheckedChange={() => handleModuleToggle(module.id)}
                  />
                  <label
                    htmlFor={module.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {module.label}{baseModules.includes(module.id as ModuleKey) ? ' (base)' : ''}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Solo los módulos marcados estarán disponibles para este tenant
            </p>
          </div>

          {/* Botones */}
          <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end">
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
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
