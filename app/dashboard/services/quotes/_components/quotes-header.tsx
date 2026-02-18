'use client';

import { useState } from 'react';
import { FilePlus2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuoteDialog } from './quote-dialog';

interface QuotesHeaderProps {
  customers: Array<{
    id: string;
    name: string;
    company: string | null;
  }>;
}

export function QuotesHeader({ customers }: QuotesHeaderProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Cotizaciones</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Crea y gestiona presupuestos de servicios y materiales
          </p>
        </div>
        <Button size="default" className="w-full md:w-auto md:size-lg" onClick={() => setShowDialog(true)}>
          <FilePlus2 className="mr-2 h-4 w-4" strokeWidth={1.75} />
          Nueva Cotización
        </Button>
      </div>

      <QuoteDialog open={showDialog} onOpenChange={setShowDialog} initialCustomers={customers} />
    </>
  );
}
