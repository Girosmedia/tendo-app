'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface SupportTicket {
  id: string;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  category: string | null;
  adminReply: string | null;
  createdAt: string;
}

const statusLabel: Record<SupportTicket['status'], string> = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En progreso',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
};

const priorityLabel: Record<SupportTicket['priority'], string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<SupportTicket['priority']>('MEDIUM');
  const [category, setCategory] = useState('general');

  const sortedTickets = useMemo(
    () => [...tickets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [tickets]
  );

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/support/tickets', { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudieron cargar los tickets');
      const data = await response.json();
      setTickets(data.tickets ?? []);
    } catch (error) {
      console.error(error);
      toast.error('No se pudieron cargar tus tickets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTickets();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (subject.trim().length < 4 || message.trim().length < 10) {
      toast.error('Completa asunto y mensaje con suficiente detalle');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          priority,
          category: category === 'general' ? null : category,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'No se pudo crear el ticket');
      }

      toast.success('Ticket creado. Soporte fue notificado.');
      setSubject('');
      setMessage('');
      setPriority('MEDIUM');
      setCategory('general');
      await loadTickets();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Error al crear ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contactar soporte</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Asunto</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Ej: No puedo cerrar caja"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select value={priority} onValueChange={(value) => setPriority(value as SupportTicket['priority'])}>
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

              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="billing">Facturación</SelectItem>
                    <SelectItem value="technical">Técnico</SelectItem>
                    <SelectItem value="training">Capacitación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensaje</Label>
              <Textarea
                id="message"
                rows={6}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Describe el problema, pasos para reproducirlo y resultado esperado."
                required
              />
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Crear ticket'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mis tickets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando tickets...</p>
          ) : sortedTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no tienes tickets creados.</p>
          ) : (
            sortedTickets.map((ticket) => (
              <div key={ticket.id} className="rounded-md border p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{ticket.subject}</p>
                  <Badge variant="secondary">{statusLabel[ticket.status]}</Badge>
                  <Badge variant="outline">{priorityLabel[ticket.priority]}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  #{ticket.id.slice(0, 8)} · {new Date(ticket.createdAt).toLocaleString('es-CL')}
                </p>
                {ticket.adminReply ? (
                  <div className="rounded bg-muted p-2 text-sm">
                    <span className="font-medium">Respuesta de soporte: </span>
                    {ticket.adminReply}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
