'use client';

import { ThemeCustomizer } from '@/components/theme-customizer';

export function TopbarActions() {
  return (
    <div className="ml-auto flex items-center gap-1">
      <ThemeCustomizer />
    </div>
  );
}
