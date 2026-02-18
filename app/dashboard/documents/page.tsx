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
              {documents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No hay documentos para mostrar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}