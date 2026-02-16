'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { ProjectExpenseDialog } from './project-expense-dialog';
import { ProjectMilestoneDialog } from './project-milestone-dialog';
import { ProjectResourceDialog } from './project-resource-dialog';
import { ProjectDialog } from '../../_components/project-dialog';
import { ArrowLeft, Plus, TrendingUp, TrendingDown, CheckCircle2, Circle, Trash2, Boxes, Pencil } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/dashboard-helpers';
import Link from 'next/link';

interface ProjectData {
  project: {
    id: string;
    name: string;
    description: string | null;
    status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
    budget: number | null;
    actualCost: number;
    startDate: string;
    endDate: string | null;
    notes: string | null;
    quote: {
      id: string;
      docNumber: number;
      total: number;
      customer: {
        id: string;
        name: string;
        company: string | null;
      } | null;
    } | null;
    expenses: Array<{
      id: string;
      milestoneId: string | null;
      description: string;
      category: string | null;
      amount: number;
      expenseDate: string;
      notes: string | null;
    }>;
    resources: Array<{
      id: string;
      milestoneId: string | null;
      name: string;
      unit: string;
      quantity: number;
      consumedQuantity: number;
      unitCost: number;
      totalCost: number;
      notes: string | null;
    }>;
    milestones: Array<{
      id: string;
      title: string;
      description: string | null;
      dueDate: string | null;
      estimatedCost: number | null;
      isCompleted: boolean;
      completedAt: string | null;
    }>;
  };
  metrics: {
    budget: number | null;
    actualCost: number;
    variance: number | null;
    budgetUsagePercent: number | null;
    resourcesCostTotal: number;
    expensesCostTotal: number;
    milestonesTotal: number;
    milestonesCompleted: number;
    milestonesProgressPercent: number;
    milestoneCostSummary: Array<{
      milestoneId: string;
      title: string;
      estimatedCost: number | null;
      realCost: number;
      variance: number | null;
    }>;
  };
  alerts: {
    projectOverBudget: {
      overAmount: number;
    } | null;
    overdueMilestones: Array<{
      milestoneId: string;
      title: string;
      dueDate: string;
    }>;
    overBudgetMilestones: Array<{
      milestoneId: string;
      title: string;
      overAmount: number;
    }>;
  };
}

interface ProjectDetailViewProps {
  projectData: ProjectData;
}

function statusLabel(status: ProjectData['project']['status']) {
  switch (status) {
    case 'ACTIVE':
      return 'Activo';
    case 'ON_HOLD':
      return 'En pausa';
    case 'COMPLETED':
      return 'Completado';
    case 'CANCELLED':
      return 'Cancelado';
    default:
      return status;
  }
}

function statusVariant(status: ProjectData['project']['status']) {
  if (status === 'ACTIVE') return 'default';
  if (status === 'ON_HOLD') return 'secondary';
  if (status === 'COMPLETED') return 'outline';
  return 'destructive';
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(Number(value));
}

export function ProjectDetailView({ projectData }: ProjectDetailViewProps) {
  const router = useRouter();
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showEditExpenseDialog, setShowEditExpenseDialog] = useState(false);
  const [showMilestoneDialog, setShowMilestoneDialog] = useState(false);
  const [showEditMilestoneDialog, setShowEditMilestoneDialog] = useState(false);
  const [showResourceDialog, setShowResourceDialog] = useState(false);
  const [showEditResourceDialog, setShowEditResourceDialog] = useState(false);
  const [loadingMilestoneId, setLoadingMilestoneId] = useState<string | null>(null);
  const [loadingResourceId, setLoadingResourceId] = useState<string | null>(null);
  const [loadingExpenseId, setLoadingExpenseId] = useState<string | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

  const { project, metrics } = projectData;

  const varianceIsPositive = useMemo(() => {
    return metrics.variance !== null && metrics.variance > 0;
  }, [metrics.variance]);

  const refreshProject = async () => {
    router.refresh();
  };

  const selectedExpense = useMemo(
    () => project.expenses.find((expense) => expense.id === selectedExpenseId) ?? null,
    [project.expenses, selectedExpenseId]
  );

  const selectedMilestone = useMemo(
    () => project.milestones.find((milestone) => milestone.id === selectedMilestoneId) ?? null,
    [project.milestones, selectedMilestoneId]
  );

  const selectedResource = useMemo(
    () => project.resources.find((resource) => resource.id === selectedResourceId) ?? null,
    [project.resources, selectedResourceId]
  );

  const openEditExpense = (expenseId: string) => {
    setSelectedExpenseId(expenseId);
    setShowEditExpenseDialog(true);
  };

  const openEditMilestone = (milestoneId: string) => {
    setSelectedMilestoneId(milestoneId);
    setShowEditMilestoneDialog(true);
  };

  const openEditResource = (resourceId: string) => {
    setSelectedResourceId(resourceId);
    setShowEditResourceDialog(true);
  };

  const toggleMilestoneStatus = async (milestoneId: string, nextState: boolean) => {
    setLoadingMilestoneId(milestoneId);

    try {
      const response = await fetch(
        `/api/services/projects/${project.id}/milestones/${milestoneId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isCompleted: nextState }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'No se pudo actualizar el hito');
        return;
      }

      toast.success(nextState ? 'Hito completado' : 'Hito reabierto');
      await refreshProject();
    } catch (error) {
      console.error('Error updating milestone:', error);
      toast.error('Error al actualizar hito');
    } finally {
      setLoadingMilestoneId(null);
    }
  };

  const deleteMilestone = async (milestoneId: string) => {
    if (!confirm('¿Seguro que quieres eliminar este hito?')) return;

    setLoadingMilestoneId(milestoneId);

    try {
      const response = await fetch(
        `/api/services/projects/${project.id}/milestones/${milestoneId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'No se pudo eliminar el hito');
        return;
      }

      toast.success('Hito eliminado');
      await refreshProject();
    } catch (error) {
      console.error('Error deleting milestone:', error);
      toast.error('Error al eliminar hito');
    } finally {
      setLoadingMilestoneId(null);
    }
  };

  const consumeAllResource = async (resourceId: string, quantity: number) => {
    setLoadingResourceId(resourceId);

    try {
      const response = await fetch(
        `/api/services/projects/${project.id}/resources/${resourceId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ consumedQuantity: quantity }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'No se pudo actualizar consumo');
        return;
      }

      toast.success('Consumo actualizado');
      await refreshProject();
    } catch (error) {
      console.error('Error updating resource:', error);
      toast.error('Error al actualizar recurso');
    } finally {
      setLoadingResourceId(null);
    }
  };

  const deleteResource = async (resourceId: string) => {
    if (!confirm('¿Seguro que quieres eliminar este recurso?')) return;

    setLoadingResourceId(resourceId);

    try {
      const response = await fetch(
        `/api/services/projects/${project.id}/resources/${resourceId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'No se pudo eliminar el recurso');
        return;
      }

      toast.success('Recurso eliminado');
      await refreshProject();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Error al eliminar recurso');
    } finally {
      setLoadingResourceId(null);
    }
  };

  const deleteExpense = async (expenseId: string) => {
    if (!confirm('¿Seguro que quieres eliminar este gasto?')) return;

    setLoadingExpenseId(expenseId);

    try {
      const response = await fetch(
        `/api/services/projects/${project.id}/expenses/${expenseId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'No se pudo eliminar el gasto');
        return;
      }

      toast.success('Gasto eliminado');
      await refreshProject();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Error al eliminar gasto');
    } finally {
      setLoadingExpenseId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link href="/dashboard/services/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Proyectos
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {project.quote
              ? `Origen: Cotización COT-${project.quote.docNumber}`
              : 'Proyecto creado manualmente'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowProjectDialog(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar proyecto
          </Button>
          <Button onClick={() => setShowExpenseDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Registrar gasto
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={statusVariant(project.status)}>{statusLabel(project.status)}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {metrics.budget !== null ? formatCurrency(metrics.budget) : 'Sin definir'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Costo real</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{formatCurrency(metrics.actualCost || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avance de hitos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {metrics.milestonesCompleted}/{metrics.milestonesTotal}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Progreso: {metrics.milestonesProgressPercent.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {(projectData.alerts.projectOverBudget ||
        projectData.alerts.overdueMilestones.length > 0 ||
        projectData.alerts.overBudgetMilestones.length > 0) && (
        <Alert variant="destructive">
          <TrendingUp className="h-4 w-4" />
          <AlertTitle>Alertas del proyecto</AlertTitle>
          <AlertDescription>
            <div className="space-y-1">
              {projectData.alerts.projectOverBudget && (
                <p>
                  Proyecto sobre presupuesto por{' '}
                  {formatCurrency(projectData.alerts.projectOverBudget.overAmount)}.
                </p>
              )}
              {projectData.alerts.overdueMilestones.map((milestone) => (
                <p key={`overdue-${milestone.milestoneId}`}>
                  Hito vencido: {milestone.title}
                </p>
              ))}
              {projectData.alerts.overBudgetMilestones.map((milestone) => (
                <p key={`overbudget-${milestone.milestoneId}`}>
                  Hito sobre estimado: {milestone.title} ({formatCurrency(milestone.overAmount)})
                </p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Variación financiera</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.variance !== null ? (
              <div className="flex items-center gap-2">
                {varianceIsPositive ? (
                  <TrendingUp className="h-4 w-4 text-destructive" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-success" />
                )}
                <p className={varianceIsPositive ? 'text-destructive font-semibold' : 'text-success font-semibold'}>
                  {formatCurrency(metrics.variance)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin presupuesto base</p>
            )}
            {metrics.budgetUsagePercent !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                Uso de presupuesto: {metrics.budgetUsagePercent.toFixed(1)}%
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Recursos: {formatCurrency(metrics.resourcesCostTotal)} · Gastos: {formatCurrency(metrics.expensesCostTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recursos y materiales</CardTitle>
          <Button size="sm" onClick={() => setShowResourceDialog(true)}>
            <Boxes className="mr-2 h-4 w-4" />
            Agregar recurso
          </Button>
        </CardHeader>
        <CardContent>
          {project.resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-muted-foreground">Aún no registras recursos para este proyecto</p>
            </div>
          ) : (
            <ResponsiveTable>
              <div style={{ minWidth: '900px' }}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recurso</TableHead>
                      <TableHead>Planificado</TableHead>
                      <TableHead>Consumido</TableHead>
                      <TableHead>Costo unitario</TableHead>
                      <TableHead>Costo total</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.resources.map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{resource.name}</p>
                            {resource.notes && (
                              <p className="text-xs text-muted-foreground truncate max-w-[260px]">
                                {resource.notes}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatQuantity(resource.quantity)} {resource.unit}</TableCell>
                        <TableCell>{formatQuantity(resource.consumedQuantity)} {resource.unit}</TableCell>
                        <TableCell>{formatCurrency(Number(resource.unitCost))}</TableCell>
                        <TableCell>{formatCurrency(Number(resource.totalCost))}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => consumeAllResource(resource.id, Number(resource.quantity))}
                              disabled={loadingResourceId === resource.id || Number(resource.consumedQuantity) >= Number(resource.quantity)}
                            >
                              Consumir todo
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditResource(resource.id)}
                              disabled={loadingResourceId === resource.id}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteResource(resource.id)}
                              disabled={loadingResourceId === resource.id}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ResponsiveTable>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Timeline de hitos</CardTitle>
          <Button size="sm" onClick={() => setShowMilestoneDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo hito
          </Button>
        </CardHeader>
        <CardContent>
          {project.milestones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-muted-foreground">Aún no registras hitos para este proyecto</p>
            </div>
          ) : (
            <div className="space-y-3">
              {project.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleMilestoneStatus(milestone.id, !milestone.isCompleted)}
                      className="mt-0.5"
                      disabled={loadingMilestoneId === milestone.id}
                      aria-label={milestone.isCompleted ? 'Reabrir hito' : 'Completar hito'}
                    >
                      {milestone.isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                    <div>
                      <p className={milestone.isCompleted ? 'line-through text-muted-foreground' : 'font-medium'}>
                        {milestone.title}
                      </p>
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {milestone.description}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        {milestone.dueDate && (
                          <span>
                            Objetivo: {format(new Date(milestone.dueDate), 'dd MMM yyyy', { locale: es })}
                          </span>
                        )}
                        {milestone.estimatedCost !== null && (
                          <span>
                            · Estimado: {formatCurrency(Number(milestone.estimatedCost))}
                          </span>
                        )}
                        {milestone.completedAt && (
                          <span>
                            · Completado: {format(new Date(milestone.completedAt), 'dd MMM yyyy', { locale: es })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditMilestone(milestone.id)}
                    disabled={loadingMilestoneId === milestone.id}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMilestone(milestone.id)}
                    disabled={loadingMilestoneId === milestone.id}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estimado vs Real por hito</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.milestoneCostSummary.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-muted-foreground">Aún no hay hitos para evaluar desvío por etapa</p>
            </div>
          ) : (
            <ResponsiveTable>
              <div style={{ minWidth: '820px' }}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hito</TableHead>
                      <TableHead>Estimado</TableHead>
                      <TableHead>Real</TableHead>
                      <TableHead>Desvío</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.milestoneCostSummary.map((row) => (
                      <TableRow key={row.milestoneId}>
                        <TableCell className="font-medium">{row.title}</TableCell>
                        <TableCell>
                          {row.estimatedCost !== null ? formatCurrency(row.estimatedCost) : '-'}
                        </TableCell>
                        <TableCell>{formatCurrency(row.realCost)}</TableCell>
                        <TableCell>
                          {row.variance === null ? (
                            '-'
                          ) : (
                            <span className={row.variance > 0 ? 'text-destructive font-medium' : 'text-success font-medium'}>
                              {formatCurrency(row.variance)}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ResponsiveTable>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información del proyecto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Inicio</p>
              <p className="font-medium">
                {format(new Date(project.startDate), 'dd MMMM yyyy', { locale: es })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cliente</p>
              <p className="font-medium">{project.quote?.customer?.name || 'Sin cliente asociado'}</p>
            </div>
          </div>
          {project.description && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Descripción</p>
                <p className="text-sm mt-1">{project.description}</p>
              </div>
            </>
          )}
          {project.notes && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Notas</p>
                <p className="text-sm mt-1">{project.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gastos del proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          {project.expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-muted-foreground">Aún no registras gastos para este proyecto</p>
            </div>
          ) : (
            <ResponsiveTable>
              <div style={{ minWidth: '780px' }}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Notas</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          {format(new Date(expense.expenseDate), 'dd MMM yyyy', { locale: es })}
                        </TableCell>
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell>{expense.category || '-'}</TableCell>
                        <TableCell>{formatCurrency(Number(expense.amount))}</TableCell>
                        <TableCell className="max-w-[320px] truncate">{expense.notes || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditExpense(expense.id)}
                              disabled={loadingExpenseId === expense.id}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteExpense(expense.id)}
                              disabled={loadingExpenseId === expense.id}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ResponsiveTable>
          )}
        </CardContent>
      </Card>

      <ProjectDialog
        mode="edit"
        projectId={project.id}
        initialData={{
          name: project.name,
          description: project.description,
          budget: project.budget,
          startDate: project.startDate,
          notes: project.notes,
        }}
        open={showProjectDialog}
        onOpenChange={setShowProjectDialog}
        onSaved={() => {
          toast.success('Proyecto actualizado');
          void refreshProject();
        }}
      />

      <ProjectExpenseDialog
        projectId={project.id}
        milestones={project.milestones.map((milestone) => ({
          id: milestone.id,
          title: milestone.title,
        }))}
        open={showExpenseDialog}
        onOpenChange={setShowExpenseDialog}
        onSaved={() => {
          toast.success('Gasto registrado');
          void refreshProject();
        }}
      />

      <ProjectExpenseDialog
        mode="edit"
        projectId={project.id}
        expenseId={selectedExpense?.id}
        initialData={selectedExpense
          ? {
              milestoneId: selectedExpense.milestoneId,
              description: selectedExpense.description,
              category: selectedExpense.category,
              amount: Number(selectedExpense.amount),
              expenseDate: selectedExpense.expenseDate,
              notes: selectedExpense.notes,
            }
          : undefined}
        milestones={project.milestones.map((milestone) => ({
          id: milestone.id,
          title: milestone.title,
        }))}
        open={showEditExpenseDialog}
        onOpenChange={(open) => {
          setShowEditExpenseDialog(open);
          if (!open) setSelectedExpenseId(null);
        }}
        onSaved={() => {
          toast.success('Gasto actualizado');
          void refreshProject();
        }}
      />

      <ProjectMilestoneDialog
        projectId={project.id}
        open={showMilestoneDialog}
        onOpenChange={setShowMilestoneDialog}
        onSaved={() => {
          toast.success('Hito creado');
          void refreshProject();
        }}
      />

      <ProjectMilestoneDialog
        mode="edit"
        projectId={project.id}
        milestoneId={selectedMilestone?.id}
        initialData={selectedMilestone
          ? {
              title: selectedMilestone.title,
              description: selectedMilestone.description,
              dueDate: selectedMilestone.dueDate,
              estimatedCost: selectedMilestone.estimatedCost,
            }
          : undefined}
        open={showEditMilestoneDialog}
        onOpenChange={(open) => {
          setShowEditMilestoneDialog(open);
          if (!open) setSelectedMilestoneId(null);
        }}
        onSaved={() => {
          toast.success('Hito actualizado');
          void refreshProject();
        }}
      />

      <ProjectResourceDialog
        projectId={project.id}
        milestones={project.milestones.map((milestone) => ({
          id: milestone.id,
          title: milestone.title,
        }))}
        open={showResourceDialog}
        onOpenChange={setShowResourceDialog}
        onSaved={() => {
          toast.success('Recurso agregado');
          void refreshProject();
        }}
      />

      <ProjectResourceDialog
        mode="edit"
        projectId={project.id}
        resourceId={selectedResource?.id}
        initialData={selectedResource
          ? {
              milestoneId: selectedResource.milestoneId,
              name: selectedResource.name,
              unit: selectedResource.unit,
              quantity: Number(selectedResource.quantity),
              consumedQuantity: Number(selectedResource.consumedQuantity),
              unitCost: Number(selectedResource.unitCost),
              notes: selectedResource.notes,
            }
          : undefined}
        milestones={project.milestones.map((milestone) => ({
          id: milestone.id,
          title: milestone.title,
        }))}
        open={showEditResourceDialog}
        onOpenChange={(open) => {
          setShowEditResourceDialog(open);
          if (!open) setSelectedResourceId(null);
        }}
        onSaved={() => {
          toast.success('Recurso actualizado');
          void refreshProject();
        }}
      />
    </div>
  );
}
