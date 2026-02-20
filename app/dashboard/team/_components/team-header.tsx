'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { InviteDialog } from './invite-dialog';
import { canInviteMembers, type TeamRole } from '@/lib/utils/team-permissions';

interface TeamHeaderProps {
  currentUserRole: TeamRole | null;
}

export function TeamHeader({ currentUserRole }: TeamHeaderProps) {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const canInvite = canInviteMembers(currentUserRole);

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gestión de Equipo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Administra los miembros de tu organización
          </p>
        </div>
        {canInvite && (
          <Button 
            size="default"
            className="w-full md:w-auto md:size-lg" 
            onClick={() => setShowInviteDialog(true)}
          >
            <UserPlus className="mr-2 h-4 w-4" strokeWidth={1.75} />
            Invitar Miembro
          </Button>
        )}
      </div>

      {canInvite && (
        <InviteDialog 
          open={showInviteDialog} 
          onOpenChange={setShowInviteDialog} 
        />
      )}
    </>
  );
}
