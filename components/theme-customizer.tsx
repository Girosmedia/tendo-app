'use client';

import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';
import { Moon, Sun, Paintbrush } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const COLOR_THEMES = [
  { id: 'default', label: 'Tendo', color: '#221f47' },
  { id: 'violet', label: 'Violeta', color: '#7c3aed' },
  { id: 'ocean', label: 'Océano', color: '#0284c7' },
  { id: 'rose', label: 'Rosa', color: '#e11d48' },
  { id: 'amber', label: 'Ámbar', color: '#d97706' },
  { id: 'teal', label: 'Teal', color: '#0d9488' },
] as const;

type ColorTheme = (typeof COLOR_THEMES)[number]['id'];

const STORAGE_KEY = 'tendo-color-theme';

export function ThemeCustomizer() {
  const { theme, setTheme } = useTheme();
  const [colorTheme, setColorTheme] = useState<ColorTheme>('default');
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const saved = (localStorage.getItem(STORAGE_KEY) ?? 'default') as ColorTheme;
    setColorTheme(saved);
    applyColorTheme(saved);
  }, []);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function applyColorTheme(id: ColorTheme) {
    if (id === 'default') {
      document.documentElement.removeAttribute('data-color');
    } else {
      document.documentElement.setAttribute('data-color', id);
    }
  }

  function handleColorChange(id: ColorTheme) {
    setColorTheme(id);
    applyColorTheme(id);
    localStorage.setItem(STORAGE_KEY, id);
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
        <Paintbrush className="h-[18px] w-[18px]" />
      </Button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <div ref={panelRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-8 w-8 rounded-full transition-all duration-200',
          open
            ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
            : 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary',
        )}
        title="Personalizar interfaz"
        onClick={() => setOpen((v) => !v)}
      >
        <Paintbrush className="h-[18px] w-[18px]" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border bg-popover p-4 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.3)]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Apariencia
          </p>

          {/* Dark / Light toggle */}
          <div className="mb-4 flex items-center justify-between rounded-xl border p-1">
            <button
              onClick={() => setTheme('light')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm font-medium transition-all',
                !isDark
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Sun className="h-3.5 w-3.5" />
              Claro
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm font-medium transition-all',
                isDark
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Moon className="h-3.5 w-3.5" />
              Oscuro
            </button>
          </div>

          {/* Color picker */}
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Color de acento
          </p>
          <div className="grid grid-cols-3 gap-2">
            {COLOR_THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleColorChange(t.id)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 transition-all hover:scale-105 active:scale-95',
                  colorTheme === t.id
                    ? 'border-foreground/30 bg-muted'
                    : 'border-transparent hover:border-border',
                )}
                title={t.label}
              >
                <span
                  className={cn(
                    'h-6 w-6 rounded-full transition-all',
                    colorTheme === t.id && 'ring-2 ring-offset-2 ring-offset-popover',
                  )}
                  style={{
                    backgroundColor: t.color,
                    ...(colorTheme === t.id ? { outlineColor: t.color } : {}),
                  }}
                />
                <span className="text-[10px] font-medium text-muted-foreground">
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

