'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Search, MoreHorizontal, Send, CircleCheck, Ban, FolderGit2, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/dashboard-helpers';

interface Quote {
  id: string;
  docNumber: number;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
  total: number;
  dueAt: string | null;
  issuedAt: string;
  customer: {
    id: string;
    name: string;
    company: string | null;
  } | null;
  project: {
    id: string;
    name: string;
    status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  } | null;
  items: Array<{ id: string }>;
}

interface QuotesTableProps {
  quotes: Quote[];
}

const STATUS_LABELS: Record<Quote['status'], string> = {
  DRAFT: 'Borrador',
  PENDING: 'Enviada',
  APPROVED: 'Aprobada',
  PAID: 'Pagada',
  CANCELLED: 'Cancelada',
};

function getStatusVariant(status: Quote['status']) {
  if (status === 'APPROVED' || status === 'PAID') return 'default';
  if (status === 'CANCELLED') return 'destructive';
  return 'secondary';
}

export function QuotesTable({ quotes }: QuotesTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredQuotes = useMemo(() => {
    const term = search.toLowerCase();
    return quotes.filter((quote) => {
      return (
        `${quote.docNumber}`.includes(term) ||
        quote.customer?.name.toLowerCase().includes(term) ||
        quote.customer?.company?.toLowerCase().includes(term)
      );
    });
  }, [quotes, search]);

  const updateStatus = async (quoteId: string, status: Quote['status']) => {
    setLoadingId(quoteId);

    try {
      const response = await fetch(`/api/services/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'No se pudo actualizar la cotización');
        return;
      }

      toast.success('Estado actualizado');
      router.refresh();
    } catch (error) {
      console.error('Error updating quote status:', error);
      toast.error('Error al actualizar estado');
    } finally {
      setLoadingId(null);
    }
  };

  const cancelQuote = async (quoteId: string) => {
    if (!confirm('¿Seguro que quieres cancelar esta cotización?')) return;

    setLoadingId(quoteId);

    try {
      const response = await fetch(`/api/services/quotes/${quoteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'No se pudo cancelar la cotización');
        return;
      }

      toast.success('Cotización cancelada');
      router.refresh();
    } catch (error) {
      console.error('Error cancelling quote:', error);
      toast.error('Error al cancelar cotización');
    } finally {
      setLoadingId(null);
    }
  };

  const convertToProject = async (quoteId: string) => {
    setLoadingId(quoteId);

    try {
      const response = await fetch(`/api/services/quotes/${quoteId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'No se pudo convertir la cotización');
        return;
      }

      toast.success('Cotización convertida a proyecto');
      router.refresh();
    } catch (error) {
      console.error('Error converting quote:', error);
      toast.error('Error al convertir cotización');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>
            {filteredQuotes.length} {filteredQuotes.length === 1 ? 'cotización' : 'cotizaciones'}
          </CardTitle>
          <div className="relative w-full md:max-w-[320px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente o número"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredQuotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              {search ? 'No se encontraron cotizaciones' : 'Aún no hay cotizaciones creadas'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {filteredQuotes.map((quote) => (
                <div key={quote.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">COT-{quote.docNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {quote.customer?.name || 'Sin cliente'}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          disabled={loadingId === quote.id || quote.status === 'CANCELLED'}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a
                            href={`/api/services/quotes/${quote.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Descargar PDF
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(quote.id, 'PENDING')}>
                          <Send className="mr-2 h-4 w-4" />
                          Marcar como enviada
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(quote.id, 'APPROVED')}>
                          <CircleCheck className="mr-2 h-4 w-4" />
                          Marcar como aprobada
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => convertToProject(quote.id)}
                          disabled={quote.status !== 'APPROVED' || !!quote.project}
                        >
                          <FolderGit2 className="mr-2 h-4 w-4" />
                          Convertir a proyecto
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => cancelQuote(quote.id)}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Cancelar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Fecha</p>
                      <p>{format(new Date(quote.issuedAt), 'dd MMM yyyy', { locale: es })}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Vigencia</p>
                      <p>
                        {quote.dueAt
                          ? format(new Date(quote.dueAt), 'dd MMM yyyy', { locale: es })
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ítems</p>
                      <p>{quote.items.length}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-semibold">{formatCurrency(Number(quote.total))}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant={getStatusVariant(quote.status)}>{STATUS_LABELS[quote.status]}</Badge>
                    {quote.project && <Badge variant="outline">Proyecto creado</Badge>}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block">
              <ResponsiveTable>
                <div style={{ minWidth: '880px' }}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N°</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Vigencia</TableHead>
                        <TableHead>Ítems</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQuotes.map((quote) => (
                        <TableRow key={quote.id}>
                          <TableCell className="font-medium">COT-{quote.docNumber}</TableCell>
                          <TableCell>
                            <div>
                              <p>{quote.customer?.name || 'Sin cliente'}</p>
                              {quote.customer?.company && (
                                <p className="text-xs text-muted-foreground">{quote.customer.company}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(quote.issuedAt), 'dd MMM yyyy', { locale: es })}
                          </TableCell>
                          <TableCell>
                            {quote.dueAt
                              ? format(new Date(quote.dueAt), 'dd MMM yyyy', { locale: es })
                              : '-'}
                          </TableCell>
                          <TableCell>{quote.items.length}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(Number(quote.total))}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(quote.status)}>{STATUS_LABELS[quote.status]}</Badge>
                            {quote.project && (
                              <p className="mt-1 text-xs text-muted-foreground">Proyecto creado</p>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  disabled={loadingId === quote.id || quote.status === 'CANCELLED'}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <a
                                    href={`/api/services/quotes/${quote.id}/pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Download className="mr-2 h-4 w-4" />
                                    Descargar PDF
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateStatus(quote.id, 'PENDING')}>
                                  <Send className="mr-2 h-4 w-4" />
                                  Marcar como enviada
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateStatus(quote.id, 'APPROVED')}>
                                  <CircleCheck className="mr-2 h-4 w-4" />
                                  Marcar como aprobada
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => convertToProject(quote.id)}
                                  disabled={quote.status !== 'APPROVED' || !!quote.project}
                                >
                                  <FolderGit2 className="mr-2 h-4 w-4" />
                                  Convertir a proyecto
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => cancelQuote(quote.id)}
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  Cancelar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ResponsiveTable>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
