'use client';

import Link from 'next/link';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ServiceAlert {
  id: string;
  type: 'PROJECT_OVER_BUDGET' | 'MILESTONE_OVER_BUDGET' | 'MILESTONE_OVERDUE';
  severity: 'high' | 'medium';
  projectId: string;
  projectName: string;
  milestoneId?: string;
  milestoneTitle?: string;
  message: string;
}

interface AlertsData {
  summary: {
    total: number;
    high: number;
    medium: number;
    byType: {
      projectOverBudget: number;
      milestoneOverBudget: number;
      milestoneOverdue: number;
    };
  };
  alerts: ServiceAlert[];
}

interface ServicesAlertsPanelProps {
  alertsData: AlertsData | null;
}

export function ServicesAlertsPanel({ alertsData }: ServicesAlertsPanelProps) {
  if (!alertsData) {
    return null;
  }

  const { summary, alerts } = alertsData;

  if (summary.total === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Sin alertas críticas</AlertTitle>
        <AlertDescription>
          Tus proyectos activos no presentan sobrecostos ni hitos vencidos.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Alertas de Servicios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="destructive">Altas: {summary.high}</Badge>
          <Badge variant="secondary">Medias: {summary.medium}</Badge>
          <Badge variant="outline">Sobrepresupuesto proyecto: {summary.byType.projectOverBudget}</Badge>
          <Badge variant="outline">Sobrecosto hito: {summary.byType.milestoneOverBudget}</Badge>
          <Badge variant="outline">Hitos vencidos: {summary.byType.milestoneOverdue}</Badge>
        </div>

        <div className="space-y-2">
          {alerts.slice(0, 6).map((alert) => (
            <Alert key={alert.id} variant={alert.severity === 'high' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{alert.projectName}</AlertTitle>
              <AlertDescription>
                <div className="flex flex-col gap-2">
                  <span>{alert.message}</span>
                  <div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/services/projects/${alert.projectId}`}>
                        Revisar proyecto
                      </Link>
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
