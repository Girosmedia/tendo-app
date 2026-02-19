import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

/**
 * Loading skeleton para la página de documentos (Boletas/Facturas)
 */
export default function DocumentsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-28 mb-2" />
            <Skeleton className="h-7 w-32 mb-1" />
            <Skeleton className="h-3 w-20" />
          </Card>
        ))}
      </div>

      {/* Documents Table */}
      <Card>
        <div className="p-6 space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-6 gap-4 pb-4 border-b">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
          </div>

          {/* Table Rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4 py-3">
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
