'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { CustomerDialog } from './customer-dialog';

export function CustomersHeader() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona tu base de clientes
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Agregar Cliente
        </Button>
      </div>

      <CustomerDialog 
        open={showDialog} 
        onOpenChange={setShowDialog} 
      />
    </>
  );
}
