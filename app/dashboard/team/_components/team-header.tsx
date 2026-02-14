'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { InviteDialog } from './invite-dialog';

export function TeamHeader() {
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Equipo</h1>
          <p className="text-muted-foreground">
            Administra los miembros de tu organización
          </p>
        </div>
        <Button onClick={() => setShowInviteDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invitar Miembro
        </Button>
      </div>

      <InviteDialog 
        open={showInviteDialog} 
        onOpenChange={setShowInviteDialog} 
      />
    </>
  );
}
