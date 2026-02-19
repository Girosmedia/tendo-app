'use client';

import { useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error Boundary para el panel de Administración
 * Captura errores críticos en el backoffice
 */
export default function AdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log crítico para errores en admin
    console.error('[ADMIN ERROR]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    // TODO: Enviar a servicio de monitoreo (Sentry, LogRocket, etc.)
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <Card className="max-w-lg w-full p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-2">Error en Panel de Administración</h2>

        <p className="text-muted-foreground mb-6">
          Ocurrió un error en el sistema de administración. Si el problema persiste,
          contacta al equipo de soporte técnico.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm font-medium mb-2 text-destructive">
              ⚠️ Detalles del error (Desarrollo)
            </summary>
            <div className="space-y-2">
              <div className="text-xs bg-destructive/10 p-4 rounded-lg">
                <strong>Mensaje:</strong>
                <pre className="mt-1 whitespace-pre-wrap">{error.message}</pre>
              </div>

              {error.digest && (
                <div className="text-xs bg-muted p-4 rounded-lg">
                  <strong>Digest:</strong> {error.digest}
                </div>
              )}

              {error.stack && (
                <div className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-48">
                  <strong>Stack Trace:</strong>
                  <pre className="mt-1">{error.stack}</pre>
                </div>
              )}
            </div>
          </details>
        )}

        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="default">
            Reintentar
          </Button>

          <Button
            variant="outline"
            onClick={() => (window.location.href = '/admin')}
          >
            Volver al Dashboard
          </Button>
        </div>

        {error.digest && (
          <div className="mt-6 p-3 bg-muted rounded-lg">
            <p className="text-xs font-mono text-muted-foreground">
              Error ID: <span className="font-semibold">{error.digest}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Incluye este ID al reportar el problema
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
