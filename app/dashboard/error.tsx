'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error Boundary para el Dashboard
 * Captura errores en runtime y muestra UI amigable
 */
export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log del error para debugging
    console.error('Dashboard Error:', error);

    // TODO: Enviar a servicio de monitoreo externo (Sentry, LogRocket)
    // No se puede llamar a DB desde componentes 'use client'
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="max-w-lg w-full p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-2">Algo salió mal</h2>

        <p className="text-muted-foreground mb-6">
          Lo sentimos, ocurrió un error inesperado. Por favor intenta nuevamente.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm font-medium mb-2">
              Detalles del error (Solo visible en desarrollo)
            </summary>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-48">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}

        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>Intentar de nuevo</Button>

          <Button
            variant="outline"
            onClick={() => (window.location.href = '/dashboard')}
          >
            Ir al inicio
          </Button>
        </div>

        {error.digest && (
          <p className="text-xs text-muted-foreground mt-4">
            Error ID: {error.digest}
          </p>
        )}
      </Card>
    </div>
  );
}
