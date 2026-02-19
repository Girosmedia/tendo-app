import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

/**
 * Loading skeleton para la página de productos
 * Muestra mientras se cargan los datos
 */
export default function ProductsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Filters Skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table Skeleton */}
      <Card>
        <div className="p-6 space-y-4">
          {/* Table Header */}
          <div className="flex gap-4 pb-4 border-b">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-32 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
          </div>

          {/* Table Rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-3">
              <Skeleton className="h-12 w-12 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
