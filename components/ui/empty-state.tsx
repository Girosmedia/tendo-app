import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface EmptyStateProps {
  /**
   * Icono de Lucide React para mostrar
   */
  icon: LucideIcon;
  /**
   * Título principal del estado vacío
   */
  title: string;
  /**
   * Descripción opcional (recomendado para guiar al usuario)
   */
  description?: string;
  /**
   * Acción principal (botón CTA)
   */
  action?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Acción secundaria opcional
   */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Componente EmptyState reutilizable para mostrar cuando no hay datos
 * 
 * @example
 * <EmptyState
 *   icon={Package}
 *   title="No hay productos"
 *   description="Comienza agregando tu primer producto al inventario"
 *   action={{
 *     label: "Agregar Producto",
 *     onClick: () => router.push('/dashboard/products/new')
 *   }}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {description}
        </p>
      )}
      
      <div className="flex gap-3">
        {action && (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )}
        
        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </Card>
  );
}
