'use client';

import * as React from 'react';
import * as RechartsPrimitive from 'recharts';

import { cn } from '@/lib/utils';

type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode;
    color?: string;
  };
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }

  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children'];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, '')}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          '[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/60 [&_.recharts-tooltip-cursor]:stroke-border [&_.recharts-reference-line_line]:stroke-border [&_.recharts-sector:focus]:outline-none',
          className
        )}
        style={
          {
            ...Object.entries(config).reduce<Record<string, string>>((acc, [key, value]) => {
              if (value.color) {
                acc[`--color-${key}`] = value.color;
              }
              return acc;
            }, {}),
          } as React.CSSProperties
        }
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartTooltip = RechartsPrimitive.Tooltip;

interface ChartTooltipItem {
  dataKey?: string | number;
  name?: string;
  value?: number | string;
}

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: ChartTooltipItem[];
  className?: string;
}

function ChartTooltipContent({
  active,
  payload,
  className,
}: ChartTooltipContentProps) {
  const { config } = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className={cn('rounded-lg border bg-background px-3 py-2 text-xs shadow-sm', className)}>
      <div className='space-y-1'>
        {payload.map((item) => {
          const itemConfig =
            item && typeof item === 'object' && item.dataKey
              ? config[String(item.dataKey)]
              : undefined;

          return (
            <div key={item.dataKey as string} className='flex items-center justify-between gap-3'>
              <span className='text-muted-foreground'>
                {itemConfig?.label ?? item.name ?? item.dataKey}
              </span>
              <span className='font-medium text-foreground'>{item.value?.toLocaleString('es-CL')}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent };
export type { ChartConfig };
