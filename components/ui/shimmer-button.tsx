'use client'

import { motion } from 'framer-motion'
import { Button } from './button'
import { cn } from '@/lib/utils'
import type { ComponentPropsWithoutRef } from 'react'

interface ShimmerButtonProps extends ComponentPropsWithoutRef<typeof Button> {
  shimmerColor?: string
  shimmerSize?: string
  borderRadius?: string
  shimmerDuration?: string
  background?: string
}

export function ShimmerButton({
  children,
  className,
  shimmerColor = '#ffffff',
  shimmerSize = '0.05em',
  borderRadius = '0.5rem',
  shimmerDuration = '3s',
  background = 'hsl(var(--primary))',
  ...props
}: ShimmerButtonProps) {
  return (
    <Button
      className={cn(
        'relative overflow-hidden',
        className
      )}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <motion.div
        className="absolute inset-0 -translate-x-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${shimmerColor} 50%, transparent)`,
          opacity: 0.3,
          willChange: 'transform',
        }}
        animate={{
          translateX: ['200%', '-200%'],
        }}
        transition={{
          repeat: Infinity,
          duration: parseFloat(shimmerDuration),
          ease: 'linear',
          repeatType: 'loop',
        }}
      />
    </Button>
  )
}
