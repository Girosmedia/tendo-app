'use client';

import { useState } from 'react';
import { FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectDialog } from './project-dialog';

export function ProjectsHeader() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Proyectos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Controla proyectos activos y su avance operacional
          </p>
        </div>
        <Button size="default" className="w-full md:w-auto md:size-lg" onClick={() => setShowDialog(true)}>
          <FolderPlus className="mr-2 h-4 w-4" strokeWidth={1.75} />
          Nuevo Proyecto
        </Button>
      </div>

      <ProjectDialog open={showDialog} onOpenChange={setShowDialog} />
    </>
  );
}
