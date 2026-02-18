'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { UserCog } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ImpersonateButtonProps {
  organizationId: string
  organizationName: string
  compact?: boolean
  className?: string
}

export function ImpersonateButton({
  organizationId,
  organizationName,
  compact = false,
  className,
}: ImpersonateButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleImpersonate = async () => {
    try {
      setIsLoading(true)
      toast.loading(`Accediendo a ${organizationName}...`)

      const res = await fetch('/api/admin/impersonate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar modo soporte')
      }

      toast.dismiss()
      toast.success(`Accediendo a ${organizationName}`)
      
      // Redirigir al dashboard del tenant
      window.location.href = '/dashboard'
    } catch (error) {
      toast.dismiss()
      toast.error(error instanceof Error ? error.message : 'Error al iniciar modo soporte')
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size={compact ? 'icon' : 'sm'}
      onClick={handleImpersonate}
      disabled={isLoading}
      className={cn(compact ? 'h-8 w-8' : 'gap-2', className)}
      title={`Acceder a ${organizationName} como admin`}
    >
      <UserCog className="h-4 w-4" />
      {compact ? <span className="sr-only">Acceder como Admin</span> : (isLoading ? 'Accediendo...' : 'Acceder como Admin')}
    </Button>
  )
}
