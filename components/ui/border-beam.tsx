'use client'

import { cn } from '@/lib/utils'

interface BorderBeamProps {
  className?: string
  size?: number
  duration?: number
  borderWidth?: number
  colorFrom?: string
  colorTo?: string
  delay?: number
}

export function BorderBeam({
  className,
  size = 200,
  duration = 15,
  borderWidth = 2,
  colorFrom = 'hsl(var(--primary))',
  colorTo = 'hsl(var(--success))',
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      style={
        {
          '--size': size,
          '--duration': duration,
          '--border-width': borderWidth,
          '--color-from': colorFrom,
          '--color-to': colorTo,
          '--delay': `-${delay}s`,
        } as React.CSSProperties
      }
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]',
        '[background:linear-gradient(to_right,var(--color-from),var(--color-to),var(--color-from))_border-box]',
        '[mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)]',
        '[mask-composite:exclude]',
        'animate-border-beam',
        className
      )}
    />
  )
}
