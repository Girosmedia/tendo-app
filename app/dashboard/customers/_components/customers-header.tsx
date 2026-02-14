'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { CustomerDialog } from './customer-dialog';

export function CustomersHeader() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestiona tu base de clientes
          </p>
        </div>
        <Button 
          size="default"
          className="w-full md:w-auto md:size-lg" 
          onClick={() => setShowDialog(true)}
        >
          <UserPlus className="mr-2 h-4 w-4" strokeWidth={1.75} />
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
