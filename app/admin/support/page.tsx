'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface AdminTicket {
  id: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  category: string | null;
  adminReply: string | null;
  createdAt: string;
  organization: {
    id: string;
    name: string;
    rut: string;
  };
  creator: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

const statusLabel: Record<AdminTicket['status'], string> = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En progreso',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
};

const priorityLabel: Record<AdminTicket['priority'], string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | AdminTicket['status']>('ALL');
  const [savingTicketId, setSavingTicketId] = useState<string | null>(null);

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const query = statusFilter === 'ALL' ? '' : `?status=${statusFilter}`;
      const response = await fetch(`/api/admin/support/tickets${query}`, { cache: 'no-store' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `No se pudieron cargar tickets (${response.status})`);
      }
      const data = await response.json();
      setTickets(data.tickets ?? []);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'No se pudieron cargar tickets de soporte');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTickets();
  }, [statusFilter]);

  const updateTicket = async (
    ticketId: string,
    payload: Partial<Pick<AdminTicket, 'status' | 'priority' | 'adminReply'>>
  ) => {
    try {
      setSavingTicketId(ticketId);
      const response = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || `No se pudo actualizar el ticket (${response.status})`);
      }

      toast.success('Ticket actualizado');
      await loadTickets();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar ticket');
    } finally {
      setSavingTicketId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bandeja de Soporte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Label>Filtrar por estado</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'ALL' | AdminTicket['status'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="OPEN">Abiertos</SelectItem>
                <SelectItem value="IN_PROGRESS">En progreso</SelectItem>
                <SelectItem value="RESOLVED">Resueltos</SelectItem>
                <SelectItem value="CLOSED">Cerrados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando tickets...</p>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay tickets para este filtro.</p>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-md border p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{ticket.subject}</p>
                  <Badge variant="secondary">{statusLabel[ticket.status]}</Badge>
                  <Badge variant="outline">{priorityLabel[ticket.priority]}</Badge>
                </div>

                <p className="text-sm">{ticket.message}</p>
                <p className="text-xs text-muted-foreground">
                  Org: {ticket.organization.name} · Usuario: {ticket.creator.name || ticket.creator.email || 'N/A'} · {new Date(ticket.createdAt).toLocaleString('es-CL')}
                </p>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select
                      value={ticket.status}
                      onValueChange={(value) => {
                        void updateTicket(ticket.id, { status: value as AdminTicket['status'] });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Abierto</SelectItem>
                        <SelectItem value="IN_PROGRESS">En progreso</SelectItem>
                        <SelectItem value="RESOLVED">Resuelto</SelectItem>
                        <SelectItem value="CLOSED">Cerrado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Prioridad</Label>
                    <Select
                      value={ticket.priority}
                      onValueChange={(value) => {
                        void updateTicket(ticket.id, { priority: value as AdminTicket['priority'] });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Baja</SelectItem>
                        <SelectItem value="MEDIUM">Media</SelectItem>
                        <SelectItem value="HIGH">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Respuesta a cliente</Label>
                  <Textarea
                    defaultValue={ticket.adminReply || ''}
                    rows={3}
                    placeholder="Escribe una respuesta o actualización para el cliente"
                    onBlur={(event) => {
                      const value = event.target.value.trim();
                      if ((ticket.adminReply || '') !== value) {
                        void updateTicket(ticket.id, { adminReply: value || null });
                      }
                    }}
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={savingTicketId === ticket.id}
                  onClick={() => void updateTicket(ticket.id, { status: 'IN_PROGRESS' })}
                >
                  {savingTicketId === ticket.id ? 'Guardando...' : 'Tomar ticket'}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
