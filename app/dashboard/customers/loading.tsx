import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

/**
 * Loading skeleton para la página de clientes
 */
export default function CustomersLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 max-w-md" />
        <Skeleton className="h-10 w-28" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-8 w-24" />
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <div className="p-6 space-y-4">
          <div className="flex gap-4 pb-4 border-b">
            <Skeleton className="h-4 w-48 flex-1" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
          </div>

          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-4 w-32" />
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
