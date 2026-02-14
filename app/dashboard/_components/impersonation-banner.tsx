'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { stopImpersonation } from '@/app/actions/impersonation'

interface ImpersonationBannerProps {
  organizationName: string
}

export function ImpersonationBanner({ organizationName }: ImpersonationBannerProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleExit = async () => {
    try {
      setIsLoading(true)
      toast.loading('Saliendo del modo soporte...')
      await stopImpersonation()
      // La redirección se maneja en el server action
    } catch (error) {
      toast.dismiss()
      toast.error(error instanceof Error ? error.message : 'Error al salir del modo soporte')
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-950 px-4 py-2 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5" />
        <span className="font-medium">
          Modo Soporte Activo - Estás viendo como: <strong>{organizationName}</strong>
        </span>
      </div>
      <Button
        onClick={handleExit}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="bg-yellow-950 text-yellow-100 hover:bg-yellow-900 hover:text-yellow-50"
      >
        {isLoading ? 'Saliendo...' : 'Salir del Modo Soporte'}
      </Button>
    </div>
  )
}
