'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, Search, Trash2, Edit, Phone, Mail } from 'lucide-react';
import { CustomerDialog } from './customer-dialog';

interface Customer {
  id: string;
  name: string;
  rut: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  company: string | null;
  creditLimit: number | null;
  currentDebt: number;
  tags: string[];
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
}

interface CustomersTableProps {
  customers: Customer[];
}

export function CustomersTable({ customers }: CustomersTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = search.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.rut?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.company?.toLowerCase().includes(searchLower)
    );
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowEditDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;

    setLoadingId(id);

    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Cliente eliminado exitosamente');
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al eliminar cliente');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar cliente');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {filteredCustomers.length}{' '}
              {filteredCustomers.length === 1 ? 'cliente' : 'clientes'}
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                {search ? 'No se encontraron clientes' : 'No hay clientes registrados'}
              </p>
              {!search && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Comienza agregando tu primer cliente
                </p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>RUT</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Crédito</TableHead>
                  <TableHead>Deuda</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        {customer.company && (
                          <div className="text-sm text-muted-foreground">
                            {customer.company}
                          </div>
                        )}
                        {customer.tags.length > 0 && (
                          <div className="mt-1 flex gap-1">
                            {customer.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{customer.rut || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {customer.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{customer.phone}</span>
                          </div>
                        )}
                        {!customer.email && !customer.phone && '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.creditLimit ? formatCurrency(customer.creditLimit) : '-'}
                    </TableCell>
                    <TableCell>
                      {customer.currentDebt > 0 ? (
                        <span className="font-medium text-rose-600">
                          {formatCurrency(customer.currentDebt)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                        {customer.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            disabled={loadingId === customer.id}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(customer)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(customer.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {editingCustomer && (
        <CustomerDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          customer={editingCustomer}
        />
      )}
    </>
  );
}
