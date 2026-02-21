'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

export function SidebarFloatingToggle() {
  const { state, toggleSidebar, isMobile } = useSidebar();

  if (isMobile) return null;

  const isExpanded = state === 'expanded';

  return (
    <button
      onClick={toggleSidebar}
      title={isExpanded ? 'Colapsar sidebar' : 'Expandir sidebar'}
      style={{
        position: 'fixed',
        top: 'calc(3.5rem + 1.25rem)',
        left: isExpanded
          ? 'calc(var(--sidebar-width) - 0.5rem)'
          : '0.375rem',
        transition: 'left 200ms ease-linear',
        zIndex: 30,
      }}
      className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background shadow-md hover:bg-accent hover:text-accent-foreground active:scale-95"
    >
      {isExpanded ? (
        <ChevronLeft className="h-3 w-3" />
      ) : (
        <ChevronRight className="h-3 w-3" />
      )}
    </button>
  );
}
