import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface PageHeaderProps {
  /**
   * Título de la página
   */
  title: string;
  /**
   * Descripción opcional de la página
   */
  description?: string;
  /**
   * Breadcrumbs para navegación
   * @example ['Dashboard', 'Productos', 'Editar']
   */
  breadcrumbs?: string[];
  /**
   * Acción principal (usualmente un botón)
   */
  action?: ReactNode;
  /**
   * Acciones secundarias
   */
  secondaryActions?: ReactNode;
}

/**
 * Componente PageHeader estandarizado para todas las páginas
 * Proporciona estructura consistente de título, breadcrumbs y acciones
 * 
 * @example
 * <PageHeader
 *   title="Productos"
 *   description="Gestiona tu inventario de productos y servicios"
 *   breadcrumbs={['Dashboard', 'Productos']}
 *   action={
 *     <Button onClick={() => router.push('/dashboard/products/new')}>
 *       Nuevo Producto
 *     </Button>
 *   }
 * />
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  action,
  secondaryActions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
      <div className="space-y-1">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-2">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
                <span
                  className={
                    index === breadcrumbs.length - 1
                      ? 'font-medium text-foreground'
                      : ''
                  }
                >
                  {crumb}
                </span>
              </div>
            ))}
          </nav>
        )}

        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {title}
        </h1>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {/* Actions */}
      {(action || secondaryActions) && (
        <div className="flex items-center gap-2">
          {secondaryActions}
          {action}
        </div>
      )}
    </div>
  );
}
