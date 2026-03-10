'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { CalendarDays, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type DashboardPeriod = 'today' | 'week' | 'month' | 'last_month' | 'quarter';

interface DashboardPeriodSelectorProps {
  value: DashboardPeriod;
}

const PERIODS: { value: DashboardPeriod; label: string; description: string }[] = [
  { value: 'today',      label: 'Hoy',               description: 'vs ayer' },
  { value: 'week',       label: 'Esta semana',        description: 'vs semana anterior' },
  { value: 'month',      label: 'Este mes',           description: 'vs mes anterior' },
  { value: 'last_month', label: 'Mes anterior',       description: 'vista histórica' },
  { value: 'quarter',    label: 'Últimos 3 meses',    description: 'vs 3 meses previos' },
];

export function DashboardPeriodSelector({ value }: DashboardPeriodSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSelect(period: DashboardPeriod) {
    const params = new URLSearchParams(searchParams.toString());
    if (period === 'month') {
      params.delete('period'); // período por defecto: URL limpia
    } else {
      params.set('period', period);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  const active = PERIODS.find((p) => p.value === value) ?? PERIODS[2];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-8 text-xs">
          <CalendarDays className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{active.label}</span>
          <span className="sm:hidden">Período</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-[11px] text-muted-foreground pb-1 font-normal">
          Período de análisis
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {PERIODS.map((p) => (
          <DropdownMenuItem
            key={p.value}
            onClick={() => handleSelect(p.value)}
            className="flex items-center justify-between gap-3 text-sm cursor-pointer"
          >
            <div className="flex flex-col min-w-0">
              <span>{p.label}</span>
              <span className="text-[11px] text-muted-foreground">{p.description}</span>
            </div>
            {value === p.value && (
              <Check className="h-3.5 w-3.5 text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
