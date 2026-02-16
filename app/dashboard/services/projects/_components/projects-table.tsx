'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Search, MoreHorizontal, PauseCircle, CircleCheck, Ban, Eye, Pencil } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/dashboard-helpers';
import { ProjectDialog } from './project-dialog';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  budget: number | null;
  actualCost: number;
  startDate: string;
  notes: string | null;
  quote: {
    id: string;
    docNumber: number;
  } | null;
}

interface ProjectsTableProps {
  projects: Project[];
}

const STATUS_LABELS: Record<Project['status'], string> = {
  ACTIVE: 'Activo',
  ON_HOLD: 'En pausa',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

function getStatusVariant(status: Project['status']) {
  if (status === 'ACTIVE') return 'default';
  if (status === 'ON_HOLD') return 'secondary';
  if (status === 'COMPLETED') return 'outline';
  return 'destructive';
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const filteredProjects = useMemo(() => {
    const term = search.toLowerCase();
    return projects.filter((project) => {
      return (
        project.name.toLowerCase().includes(term) ||
        (project.quote ? `cot-${project.quote.docNumber}`.includes(term) : false)
      );
    });
  }, [projects, search]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const openEditProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setShowEditDialog(true);
  };

  const updateStatus = async (projectId: string, status: Project['status']) => {
    setLoadingId(projectId);

    try {
      const response = await fetch(`/api/services/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'No se pudo actualizar el proyecto');
        return;
      }

      toast.success('Estado de proyecto actualizado');
      router.refresh();
    } catch (error) {
      console.error('Error updating project status:', error);
      toast.error('Error al actualizar estado del proyecto');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>
            {filteredProjects.length} {filteredProjects.length === 1 ? 'proyecto' : 'proyectos'}
          </CardTitle>
          <div className="relative w-full max-w-[320px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar proyecto"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              {search ? 'No se encontraron proyectos' : 'Aún no hay proyectos creados'}
            </p>
          </div>
        ) : (
          <ResponsiveTable>
            <div style={{ minWidth: '900px' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Inicio</TableHead>
                    <TableHead>Presupuesto</TableHead>
                    <TableHead>Costo real</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>
                        {project.quote ? `COT-${project.quote.docNumber}` : 'Manual'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(project.startDate), 'dd MMM yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>
                        {project.budget !== null ? formatCurrency(Number(project.budget)) : '-'}
                      </TableCell>
                      <TableCell>{formatCurrency(Number(project.actualCost || 0))}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(project.status)}>
                          {STATUS_LABELS[project.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              disabled={loadingId === project.id}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditProject(project.id)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar proyecto
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/services/projects/${project.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalle
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(project.id, 'ON_HOLD')}>
                              <PauseCircle className="mr-2 h-4 w-4" />
                              Marcar en pausa
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(project.id, 'COMPLETED')}>
                              <CircleCheck className="mr-2 h-4 w-4" />
                              Marcar completado
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => updateStatus(project.id, 'CANCELLED')}
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Cancelar proyecto
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ResponsiveTable>
        )}
      </CardContent>

      <ProjectDialog
        mode="edit"
        projectId={selectedProject?.id}
        initialData={selectedProject
          ? {
              name: selectedProject.name,
              description: selectedProject.description,
              budget: selectedProject.budget,
              startDate: selectedProject.startDate,
              notes: selectedProject.notes,
            }
          : undefined}
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) setSelectedProjectId(null);
        }}
        onSaved={() => {
          toast.success('Proyecto actualizado');
          router.refresh();
        }}
      />
    </Card>
  );
}
