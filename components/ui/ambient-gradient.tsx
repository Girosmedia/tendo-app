'use client'

import { motion } from 'framer-motion'

export function AmbientGradient() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden" style={{ contain: 'layout style paint' }}>
      {/* Gradient Orbs - Optimized with GPU acceleration */}
      <motion.div
        className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-primary/30 blur-[120px]"
        style={{ willChange: 'transform' }}
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
          repeatType: 'loop',
        }}
      />
      <motion.div
        className="absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-success/20 blur-[120px]"
        style={{ willChange: 'transform' }}
        animate={{
          x: [0, -30, 0],
          y: [0, 50, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
          repeatType: 'loop',
        }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[140px]"
        style={{ willChange: 'transform' }}
        animate={{
          x: [0, 40, 0],
          y: [0, -40, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut',
          repeatType: 'loop',
        }}
      />

      {/* Noise Texture Overlay - Static for better performance */}
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='3.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          contain: 'strict',
        }}
      />

      {/* Grid Pattern - Static for better performance */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          contain: 'strict',
        }}
      />
    </div>
  )
}
