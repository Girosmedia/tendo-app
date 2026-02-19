'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Building2,
  UserPlus,
  Clock,
  Percent,
} from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

interface AdminMetrics {
  mrr: number;
  arr: number;
  trialCount: number;
  totalOrgs: number;
  activeOrgs: number;
  churnRate: number;
  newMrr: number;
  growthData: Array<{ month: string; count: number }>;
}

export function AdminMetricsDashboard() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/metrics')
      .then((res) => res.json())
      .then((data) => {
        setMetrics(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error loading metrics:', error);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Error al cargar métricas</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const stats = [
    {
      title: 'MRR',
      value: formatCurrency(metrics.mrr),
      description: `ARR: ${formatCurrency(metrics.arr)}`,
      icon: DollarSign,
      color: 'text-success',
    },
    {
      title: 'Total Tenants',
      value: metrics.totalOrgs,
      description: `${metrics.activeOrgs} activos (${Math.round((metrics.activeOrgs / metrics.totalOrgs) * 100)}%)`,
      icon: Building2,
      color: 'text-primary',
    },
    {
      title: 'En Trial',
      value: metrics.trialCount,
      description: 'Organizaciones evaluando',
      icon: Clock,
      color: 'text-orange-500',
    },
    {
      title: 'Churn Rate',
      value: `${metrics.churnRate}%`,
      description: `New MRR: ${formatCurrency(metrics.newMrr)}`,
      icon: Percent,
      color: metrics.churnRate > 5 ? 'text-destructive' : 'text-success',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crecimiento de Tenants</CardTitle>
          <CardDescription>
            Nuevas organizaciones por mes (últimos 12 meses)
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={metrics.growthData}>
              <XAxis
                dataKey="month"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip />
              <Bar
                dataKey="count"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
