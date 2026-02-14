'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/hooks/use-mobile'

/**
 * ResponsiveTable Component
 * 
 * Parte del Design System Tendo v1.0 - "Zimple Style"
 * Wrapper para tablas que agrega scroll horizontal en móvil.
 * 
 * Características:
 * - Scroll horizontal automático en pantallas pequeñas
 * - Indicadores visuales de scroll (sombras)
 * - Touch-friendly con momentum scrolling
 * - Preserva la accesibilidad
 * 
 * @component
 */

interface ResponsiveTableProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export function ResponsiveTable({ children, className, ...props }: ResponsiveTableProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [showLeftShadow, setShowLeftShadow] = React.useState(false)
  const [showRightShadow, setShowRightShadow] = React.useState(false)
  const isMobile = useMediaQuery('(max-width: 768px)')

  const handleScroll = React.useCallback(() => {
    const element = scrollRef.current
    if (!element) return

    const { scrollLeft, scrollWidth, clientWidth } = element
    
    // Mostrar sombra izquierda si no está al inicio
    setShowLeftShadow(scrollLeft > 0)
    
    // Mostrar sombra derecha si no está al final
    setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1)
  }, [])

  React.useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    // Check inicial
    handleScroll()

    // Observer para detectar cambios en el contenido
    const resizeObserver = new ResizeObserver(handleScroll)
    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
    }
  }, [handleScroll])

  React.useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    element.addEventListener('scroll', handleScroll, { passive: true })
    return () => element.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return (
    <div className={cn('relative', className)} {...props}>
      {/* Sombra izquierda */}
      {isMobile && showLeftShadow && (
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background to-transparent z-10" />
      )}

      {/* Contenedor con scroll */}
      <div
        ref={scrollRef}
        className={cn(
          'overflow-x-auto',
          isMobile && 'snap-x snap-mandatory'
        )}
        style={{
          WebkitOverflowScrolling: 'touch', // iOS momentum scrolling
        }}
      >
        {children}
      </div>

      {/* Sombra derecha */}
      {isMobile && showRightShadow && (
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-background to-transparent z-10" />
      )}

      {/* Indicador de scroll móvil */}
      {isMobile && showRightShadow && (
        <div className="flex justify-center items-center gap-1 mt-2 text-xs text-muted-foreground">
          <svg
            className="h-4 w-4 animate-bounce-horizontal"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span>Desliza para ver más</span>
        </div>
      )}
    </div>
  )
}

/**
 * ResponsiveTableMinWidth
 * 
 * Establece un ancho mínimo para la tabla dentro del ResponsiveTable.
 * Útil para forzar scroll en móvil cuando hay muchas columnas.
 */
interface ResponsiveTableMinWidthProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  minWidth?: string | number
  className?: string
}

export function ResponsiveTableMinWidth({
  children,
  minWidth = '600px',
  className,
  ...props
}: ResponsiveTableMinWidthProps) {
  return (
    <div
      className={cn('w-full', className)}
      style={{ minWidth }}
      {...props}
    >
      {children}
    </div>
  )
}
