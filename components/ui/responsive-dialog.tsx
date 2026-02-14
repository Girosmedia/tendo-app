'use client'

import * as React from 'react'
import { useMediaQuery } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'

/**
 * ResponsiveDialog Component
 * 
 * Parte del Design System Tendo v1.0 - "Zimple Style"
 * Automáticamente usa Sheet en móvil (< 768px) y Dialog en desktop.
 * 
 * Mejor UX móvil: Los sheets emergen desde abajo, más ergonómicos para el pulgar.
 * Desktop: Mantiene el comportamiento tradicional de modal centrado.
 * 
 * @component
 */

interface ResponsiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  children,
}: ResponsiveDialogProps) {
  const isMobile = useMediaQuery('(max-width: 768px)')

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        {children}
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  )
}

interface ResponsiveDialogContentProps extends React.ComponentProps<typeof DialogContent> {
  children: React.ReactNode
  className?: string
}

export function ResponsiveDialogContent({
  children,
  className,
  ...props
}: ResponsiveDialogContentProps) {
  const isMobile = useMediaQuery('(max-width: 768px)')

  if (isMobile) {
    return (
      <SheetContent 
        side="bottom" 
        className={cn(
          "max-h-[92vh] overflow-y-auto", 
          className
        )}
      >
        <div className="pb-4">
          {children}
        </div>
      </SheetContent>
    )
  }

  return (
    <DialogContent className={className} {...props}>
      {children}
    </DialogContent>
  )
}

export function ResponsiveDialogHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const isMobile = useMediaQuery('(max-width: 768px)')

  if (isMobile) {
    return <SheetHeader className={className}>{children}</SheetHeader>
  }

  return <DialogHeader className={className}>{children}</DialogHeader>
}

export function ResponsiveDialogTitle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const isMobile = useMediaQuery('(max-width: 768px)')

  if (isMobile) {
    return <SheetTitle className={className}>{children}</SheetTitle>
  }

  return <DialogTitle className={className}>{children}</DialogTitle>
}

export function ResponsiveDialogDescription({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const isMobile = useMediaQuery('(max-width: 768px)')

  if (isMobile) {
    return <SheetDescription className={className}>{children}</SheetDescription>
  }

  return <DialogDescription className={className}>{children}</DialogDescription>
}

export function ResponsiveDialogFooter({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const isMobile = useMediaQuery('(max-width: 768px)')

  if (isMobile) {
    return <SheetFooter className={className}>{children}</SheetFooter>
  }

  return <DialogFooter className={className}>{children}</DialogFooter>
}
