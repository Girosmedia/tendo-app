'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface SubscriptionInfo {
  id: string
  planId: string
  status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELED'
  currentPeriodStart: string
  currentPeriodEnd: string
  trialStartedAt: string
  trialEndsAt: string | null
  mrr: number
  isFounderPartner: boolean
  discountPercent: number
}

interface SubscriptionDetailsSheetProps {
  tenantName: string
  subscription: SubscriptionInfo | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type LifecycleAction = 'ACTIVATE' | 'RENEW' | 'SUSPEND' | 'CANCEL'

const subscriptionStatusLabel: Record<SubscriptionInfo['status'], string> = {
  TRIAL: 'Trial',
  ACTIVE: 'Activa',
  SUSPENDED: 'Suspendida',
  CANCELED: 'Cancelada',
}

const subscriptionStatusVariant: Record<SubscriptionInfo['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  TRIAL: 'secondary',
  ACTIVE: 'default',
  SUSPENDED: 'destructive',
  CANCELED: 'outline',
}

function formatDate(value: string | null) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value)
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-2 sm:gap-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

function getLifecycleAlert(subscription: SubscriptionInfo) {
  const now = new Date()

  if (subscription.status === 'TRIAL' && subscription.trialEndsAt) {
    const trialEnd = new Date(subscription.trialEndsAt)
    const days = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (days < 0) {
      return {
        text: 'El trial está vencido. Debes activar o suspender esta suscripción.',
        variant: 'destructive' as const,
      }
    }

    if (days <= 3) {
      return {
        text: `El trial termina en ${days} día(s).`,
        variant: 'secondary' as const,
      }
    }
  }

  if (subscription.status === 'ACTIVE') {
    const periodEnd = new Date(subscription.currentPeriodEnd)
    const days = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (days < 0) {
      return {
        text: 'El período vigente está vencido. Debes renovar o suspender.',
        variant: 'destructive' as const,
      }
    }

    if (days <= 3) {
      return {
        text: `El período vigente termina en ${days} día(s).`,
        variant: 'secondary' as const,
      }
    }
  }

  return null
}

export function SubscriptionDetailsSheet({
  tenantName,
  subscription,
  open,
  onOpenChange,
}: SubscriptionDetailsSheetProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLifecycleAction = async (action: LifecycleAction) => {
    if (!subscription) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/subscriptions/${subscription.id}/lifecycle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'No fue posible actualizar la suscripción')
        return
      }

      toast.success('Suscripción actualizada correctamente')
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error actualizando suscripción:', error)
      toast.error('Error al actualizar la suscripción')
    } finally {
      setIsSubmitting(false)
    }
  }

  const lifecycleAlert = subscription ? getLifecycleAlert(subscription) : null

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[580px] overflow-y-auto">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Detalle de Suscripción</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Información de facturación y trial del tenant <strong>{tenantName}</strong>
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        {!subscription ? (
          <div className="rounded-lg border p-4 text-sm text-muted-foreground">
            Este tenant no tiene un registro de suscripción asociado.
          </div>
        ) : (
          <div className="space-y-5">
            {lifecycleAlert && (
              <div className="rounded-lg border p-3 text-sm">
                <Badge variant={lifecycleAlert.variant}>{lifecycleAlert.text}</Badge>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={subscriptionStatusVariant[subscription.status]}>
                {subscriptionStatusLabel[subscription.status]}
              </Badge>
              <Badge variant="outline">Plan {subscription.planId}</Badge>
              {subscription.isFounderPartner && (
                <Badge variant="secondary">Socio Fundador</Badge>
              )}
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <DetailRow label="MRR" value={formatCurrency(subscription.mrr)} />
              <DetailRow label="Descuento aplicado" value={`${subscription.discountPercent}%`} />
              <DetailRow label="Inicio suscripción" value={formatDate(subscription.trialStartedAt)} />
              <DetailRow label="Inicio período actual" value={formatDate(subscription.currentPeriodStart)} />
              <DetailRow label="Fin período actual" value={formatDate(subscription.currentPeriodEnd)} />
              <DetailRow label="Inicio trial" value={formatDate(subscription.trialStartedAt)} />
              <DetailRow label="Fin trial" value={formatDate(subscription.trialEndsAt)} />
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-medium">Acciones de Control Manual</p>
              <div className="flex flex-wrap gap-2">
                {(subscription.status === 'TRIAL' || subscription.status === 'SUSPENDED' || subscription.status === 'CANCELED') && (
                  <Button onClick={() => handleLifecycleAction('ACTIVATE')} disabled={isSubmitting}>
                    Activar Suscripción
                  </Button>
                )}

                {subscription.status === 'ACTIVE' && (
                  <Button onClick={() => handleLifecycleAction('RENEW')} disabled={isSubmitting}>
                    Confirmar Renovación
                  </Button>
                )}

                {(subscription.status === 'TRIAL' || subscription.status === 'ACTIVE') && (
                  <Button variant="outline" onClick={() => handleLifecycleAction('SUSPEND')} disabled={isSubmitting}>
                    Suspender
                  </Button>
                )}

                {subscription.status === 'SUSPENDED' && (
                  <Button variant="destructive" onClick={() => handleLifecycleAction('CANCEL')} disabled={isSubmitting}>
                    Cancelar Definitivo
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
