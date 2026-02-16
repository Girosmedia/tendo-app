'use client';

import { Bar, BarChart, CartesianGrid, Cell, XAxis } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface ProjectStatusItem {
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  total: number;
}

interface ProjectsStatusChartProps {
  data: ProjectStatusItem[];
}

const chartConfig = {
  total: {
    label: 'Proyectos',
  },
  active: {
    label: 'Activos',
    color: 'var(--chart-1)',
  },
  onHold: {
    label: 'En pausa',
    color: 'var(--chart-2)',
  },
  completed: {
    label: 'Completados',
    color: 'var(--chart-3)',
  },
  cancelled: {
    label: 'Cancelados',
    color: 'var(--chart-4)',
  },
} satisfies ChartConfig;

const statusLabelMap: Record<ProjectStatusItem['status'], string> = {
  ACTIVE: 'Activos',
  ON_HOLD: 'En pausa',
  COMPLETED: 'Completados',
  CANCELLED: 'Cancelados',
};

const statusColorMap: Record<ProjectStatusItem['status'], string> = {
  ACTIVE: 'var(--color-active)',
  ON_HOLD: 'var(--color-onHold)',
  COMPLETED: 'var(--color-completed)',
  CANCELLED: 'var(--color-cancelled)',
};

export function ProjectsStatusChart({ data }: ProjectsStatusChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    label: statusLabelMap[item.status],
  }));

  return (
    <ChartContainer config={chartConfig} className='h-[260px] w-full'>
      <BarChart data={chartData} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey='label'
          tickLine={false}
          tickMargin={8}
          axisLine={false}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent />}
        />
        <Bar dataKey='total' radius={6}>
          {chartData.map((entry) => (
            <Cell key={entry.status} fill={statusColorMap[entry.status]} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
