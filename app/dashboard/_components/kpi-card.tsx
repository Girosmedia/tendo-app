import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowUp, ArrowDown, Minus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  /** Título de la métrica */
  title: string;
  /** Valor principal formateado */
  value: string;
  /** Etiqueta explícita del período: "Hoy", "Acumulado del mes", "Mes anterior", etc. */
  periodLabel: string;
  /** Línea secundaria bajo el valor (conteo, valor neto, etc.) */
  subValue?: string;
  /** Porcentaje de crecimiento vs período anterior */
  growthPercent?: number | null;
  /** Valor del período anterior para mostrar en el tooltip de comparación */
  previousValue?: string;
  /** Texto del período de comparación, ej: "ayer", "mes anterior" */
  comparisonLabel?: string;
  /** Descripción técnica que aparece sólo en tooltip del ícono de info */
  description?: string;
  /** Ícono Lucide opcional */
  icon?: LucideIcon;
  /** Alerta semántica secundaria */
  alert?: string;
  alertVariant?: 'warning' | 'destructive' | 'success';
}

export function KpiCard({
  title,
  value,
  periodLabel,
  subValue,
  growthPercent,
  previousValue,
  comparisonLabel,
  description,
  icon: Icon,
  alert,
  alertVariant = 'warning',
}: KpiCardProps) {
  const hasGrowth = growthPercent !== undefined && growthPercent !== null;
  const isPositive = hasGrowth && growthPercent > 0;
  const isNegative = hasGrowth && growthPercent < 0;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-lg border bg-muted/40 p-3 space-y-1">
        {/* Header: título + ícono + tooltip */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{title}</p>
            {description && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground/40 shrink-0 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-55 text-xs leading-snug">
                  {description}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />}
        </div>

        {/* Etiqueta de período explícita */}
        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/70 leading-none">
          {periodLabel}
        </p>

        {/* Valor principal */}
        <p className="text-base font-semibold md:text-lg leading-none">{value}</p>

        {/* Sublínea */}
        {subValue && (
          <p className="text-[11px] text-muted-foreground">{subValue}</p>
        )}

        {/* Indicador de crecimiento vs período anterior */}
        {hasGrowth && (
          <div className="flex items-center gap-1 flex-wrap pt-0.5">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-xs font-semibold',
                isPositive && 'text-success',
                isNegative && 'text-destructive',
                !isPositive && !isNegative && 'text-muted-foreground'
              )}
            >
              {isPositive && <ArrowUp className="h-3 w-3" />}
              {isNegative && <ArrowDown className="h-3 w-3" />}
              {!isPositive && !isNegative && <Minus className="h-3 w-3" />}
              {isPositive ? '+' : ''}
              {growthPercent.toFixed(1)}%
            </span>
            {comparisonLabel && (
              <span className="text-[11px] text-muted-foreground">
                vs {comparisonLabel}
                {previousValue ? ` (${previousValue})` : ''}
              </span>
            )}
          </div>
        )}

        {/* Alerta semántica */}
        {alert && (
          <p
            className={cn(
              'text-[11px] font-medium',
              alertVariant === 'warning' && 'text-warning',
              alertVariant === 'destructive' && 'text-destructive',
              alertVariant === 'success' && 'text-success'
            )}
          >
            {alert}
          </p>
        )}
      </div>
    </TooltipProvider>
  );
}

/** Versión Card completa para uso fuera del grid inline de Pulso de Ventas */
export function KpiCardFull({
  title,
  value,
  periodLabel,
  subValue,
  growthPercent,
  previousValue,
  comparisonLabel,
  description,
  icon: Icon,
  alert,
  alertVariant = 'warning',
}: KpiCardProps) {
  const hasGrowth = growthPercent !== undefined && growthPercent !== null;
  const isPositive = hasGrowth && growthPercent > 0;
  const isNegative = hasGrowth && growthPercent < 0;

  return (
    <TooltipProvider delayDuration={200}>
      <Card>
        <CardHeader className="pb-1 pt-4 px-4 flex flex-row items-start justify-between space-y-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            {description && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-55 text-xs leading-snug">
                  {description}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/70">
            {periodLabel}
          </p>
          <p className="text-2xl font-bold leading-none">{value}</p>
          {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
          {hasGrowth && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-semibold',
                  isPositive && 'text-success',
                  isNegative && 'text-destructive',
                  !isPositive && !isNegative && 'text-muted-foreground'
                )}
              >
                {isPositive && <ArrowUp className="h-3 w-3" />}
                {isNegative && <ArrowDown className="h-3 w-3" />}
                {!isPositive && !isNegative && <Minus className="h-3 w-3" />}
                {isPositive ? '+' : ''}
                {growthPercent.toFixed(1)}%
              </span>
              {comparisonLabel && (
                <span className="text-[11px] text-muted-foreground">
                  vs {comparisonLabel}
                  {previousValue ? ` (${previousValue})` : ''}
                </span>
              )}
            </div>
          )}
          {alert && (
            <p
              className={cn(
                'text-[11px] font-medium',
                alertVariant === 'warning' && 'text-warning',
                alertVariant === 'destructive' && 'text-destructive',
                alertVariant === 'success' && 'text-success'
              )}
            >
              {alert}
            </p>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
