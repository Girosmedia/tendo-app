import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const documentTypeLabels: Record<string, string> = {
  SALE: 'Venta',
  QUOTE: 'Cotización',
  INVOICE: 'Factura',
  RECEIPT: 'Boleta',
  CREDIT_NOTE: 'Nota de crédito',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Borrador',
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  PAID: 'Pagado',
  CANCELLED: 'Anulado',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'PAID' || status === 'APPROVED') return 'default';
  if (status === 'PENDING') return 'secondary';
  if (status === 'CANCELLED') return 'destructive';
  return 'outline';
}

export const metadata = {
  title: 'Documentos | Tendo',
  description: 'Resumen operativo de documentos comerciales',
};

export default async function DocumentsPage() {
  const session = await auth();

  if (!session?.user?.organizationId) {
    redirect('/login');
  }

  const documents = await db.document.findMany({
    where: { organizationId: session.user.organizationId },
    select: {
      id: true,
      docNumber: true,
      docPrefix: true,
      type: true,
      status: true,
      total: true,
      issuedAt: true,
      customer: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { issuedAt: 'desc' },
    take: 50,
  });

  const totalAmount = documents.reduce((acc, doc) => acc + Number(doc.total), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Documentos</h2>
        <p className="text-sm text-muted-foreground">
          Vista operativa de los últimos 50 documentos emitidos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total documentos</CardDescription>
            <CardTitle className="text-2xl">{documents.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pagados</CardDescription>
            <CardTitle className="text-2xl">
              {documents.filter((doc) => doc.status === 'PAID').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monto acumulado</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalAmount)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado reciente</CardTitle>
          <CardDescription>
            Incluye tipo, estado, cliente y total por documento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No hay documentos para mostrar.
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {documents.map((doc) => (
                  <div key={doc.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {doc.docPrefix ? `${doc.docPrefix}-${doc.docNumber}` : `#${doc.docNumber}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {documentTypeLabels[doc.type] ?? doc.type}
                        </p>
                      </div>
                      <Badge variant={getStatusVariant(doc.status)}>
                        {statusLabels[doc.status] ?? doc.status}
                      </Badge>
                    </div>

                    <div className="mt-3 space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Cliente:</span>{' '}
                        {doc.customer?.name ?? 'Consumidor final'}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Fecha:</span>{' '}
                        {new Intl.DateTimeFormat('es-CL', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        }).format(doc.issuedAt)}
                      </p>
                      <p className="font-semibold">{formatCurrency(Number(doc.total))}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          {doc.docPrefix ? `${doc.docPrefix}-${doc.docNumber}` : `#${doc.docNumber}`}
                        </TableCell>
                        <TableCell>{documentTypeLabels[doc.type] ?? doc.type}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(doc.status)}>
                            {statusLabels[doc.status] ?? doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{doc.customer?.name ?? 'Consumidor final'}</TableCell>
                        <TableCell>
                          {new Intl.DateTimeFormat('es-CL', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          }).format(doc.issuedAt)}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(doc.total))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}