'use client'

import { Home, ShoppingCart, Package, Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/ui/sidebar'

/**
 * Bottom TabBar para navegación móvil (Mobile-First)
 * 
 * Parte del Design System Tendo v1.0 - "Zimple Style"
 * Proporciona navegación persistente en la parte inferior para dispositivos móviles.
 * Touch targets de 64px de altura (44px mínimo + padding) para facilitar uso con el pulgar.
 * 
 * @component
 */
export function MobileTabBar() {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  
  const tabs = [
    { 
      icon: Home, 
      label: 'Inicio', 
      href: '/dashboard',
      match: (path: string) => path === '/dashboard'
    },
    { 
      icon: ShoppingCart, 
      label: 'Ventas', 
      href: '/dashboard/pos',
      match: (path: string) => path.startsWith('/dashboard/pos')
    },
    { 
      icon: Package, 
      label: 'Inventario', 
      href: '/dashboard/products',
      match: (path: string) => path.startsWith('/dashboard/products')
    },
  ]
  
  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-50 safe-area-inset-bottom"
      aria-label="Navegación principal móvil"
    >
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.match(pathname)
          
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full min-h-[44px] transition-colors rounded-lg",
                isActive 
                  ? 'text-brand-primary' 
                  : 'text-muted-foreground hover:text-foreground active:text-brand-primary'
              )}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon 
                className={cn(
                  "mb-1 transition-all",
                  isActive ? "h-6 w-6" : "h-5 w-5"
                )} 
                strokeWidth={1.75} 
                aria-hidden="true"
              />
              <span 
                className={cn(
                  "text-xs font-medium transition-all",
                  isActive ? "font-semibold" : "font-normal"
                )}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
        
        {/* Botón Más - Abre el Sidebar */}
        <button
          onClick={() => setOpenMobile(true)}
          className="flex flex-col items-center justify-center w-full h-full min-h-[44px] transition-colors rounded-lg text-muted-foreground hover:text-foreground active:text-brand-primary"
          aria-label="Menú completo"
        >
          <Menu className="h-5 w-5 mb-1" strokeWidth={1.75} aria-hidden="true" />
          <span className="text-xs font-medium">Más</span>
        </button>
      </div>
    </nav>
  )
}
