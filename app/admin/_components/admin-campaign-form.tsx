'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CampaignResponse {
  message: string;
  recipients: number;
  sentCount: number;
  failedCount: number;
}

const DEFAULT_HTML_CAMPAIGN_TEMPLATE = `<h3 style="margin:0 0 12px 0;color:#111827;font-size:20px;line-height:1.3;">Hola equipo 👋</h3>
<p style="margin:0 0 12px 0;color:#1f2937;font-size:15px;line-height:1.6;">
  Tenemos una actualización importante para tu operación en Tendo.
</p>
<ul style="margin:0 0 14px 20px;padding:0;color:#1f2937;font-size:15px;line-height:1.6;">
  <li>Mejora 1 destacada</li>
  <li>Mejora 2 destacada</li>
  <li>Recomendación de uso</li>
</ul>
<p style="margin:0;color:#1f2937;font-size:15px;line-height:1.6;">
  Gracias por confiar en nosotros.<br />
  <strong>Equipo Tendo</strong>
</p>`;

const COMMERCIAL_HTML_CAMPAIGN_TEMPLATE = `<h3 style="margin:0 0 12px 0;color:#111827;font-size:20px;line-height:1.3;">¡Nuevas oportunidades para crecer con Tendo! 🚀</h3>
<p style="margin:0 0 12px 0;color:#1f2937;font-size:15px;line-height:1.6;">
  Queremos compartirte novedades pensadas para mejorar tus resultados de venta.
</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 14px 0;border-collapse:separate;border-spacing:0;">
  <tr>
    <td style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;">
      <p style="margin:0 0 8px 0;color:#111827;font-size:14px;font-weight:600;">Beneficio destacado</p>
      <p style="margin:0;color:#1f2937;font-size:14px;line-height:1.5;">Describe aquí la propuesta de valor principal para la audiencia.</p>
    </td>
  </tr>
</table>
<p style="margin:0;color:#1f2937;font-size:15px;line-height:1.6;">
  Si quieres apoyo para implementar estas mejoras, estamos disponibles para ayudarte.
</p>`;

const OPERATIVE_HTML_CAMPAIGN_TEMPLATE = `<h3 style="margin:0 0 12px 0;color:#111827;font-size:20px;line-height:1.3;">Comunicado operativo</h3>
<p style="margin:0 0 12px 0;color:#1f2937;font-size:15px;line-height:1.6;">
  Te informamos sobre un ajuste importante para la operación diaria.
</p>
<p style="margin:0 0 10px 0;color:#1f2937;font-size:15px;line-height:1.6;"><strong>Fecha de aplicación:</strong> [completar]</p>
<p style="margin:0 0 10px 0;color:#1f2937;font-size:15px;line-height:1.6;"><strong>Alcance:</strong> [completar]</p>
<p style="margin:0 0 14px 0;color:#1f2937;font-size:15px;line-height:1.6;"><strong>Acción requerida:</strong> [completar]</p>
<p style="margin:0;color:#1f2937;font-size:15px;line-height:1.6;">
  Ante cualquier duda, responde este correo y te apoyaremos.
</p>`;

export function AdminCampaignForm() {
  const [audience, setAudience] = useState<'OWNER' | 'ADMIN' | 'OWNER_ADMIN'>('OWNER_ADMIN');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isHtml, setIsHtml] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<CampaignResponse | null>(null);

  const previewSubject = subject.trim() || 'Asunto de campaña';
  const previewPlainTextParagraphs = message
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  const handleLoadHtmlTemplate = (
    template: 'base' | 'commercial' | 'operative'
  ) => {
    setIsHtml(true);

    if (template === 'commercial') {
      setMessage(COMMERCIAL_HTML_CAMPAIGN_TEMPLATE);
      if (!subject.trim()) {
        setSubject('Nuevas oportunidades comerciales con Tendo');
      }
      toast.success('Plantilla comercial cargada.');
      return;
    }

    if (template === 'operative') {
      setMessage(OPERATIVE_HTML_CAMPAIGN_TEMPLATE);
      if (!subject.trim()) {
        setSubject('Comunicado operativo importante');
      }
      toast.success('Plantilla operativa cargada.');
      return;
    }

    setMessage(DEFAULT_HTML_CAMPAIGN_TEMPLATE);

    if (!subject.trim()) {
      setSubject('Novedades de Tendo para tu equipo');
    }

    toast.success('Plantilla base cargada.');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!subject.trim() || !message.trim()) {
      toast.error('Debes completar asunto y mensaje.');
      return;
    }

    try {
      setIsSending(true);
      setResult(null);

      const response = await fetch('/api/admin/campaigns/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audience,
          subject,
          message,
          isHtml,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'No fue posible enviar la campaña.');
        return;
      }

      setResult(data as CampaignResponse);
      toast.success(data.message || 'Campaña enviada correctamente.');
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error('Error enviando campaña:', error);
      toast.error('Error al enviar la campaña.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Envío de campaña por correo</CardTitle>
        <CardDescription>
          Disponible solo para super admins. Envía un correo manual a owners y/o admins activos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="audience">Audiencia</Label>
            <Select
              value={audience}
              onValueChange={(value: 'OWNER' | 'ADMIN' | 'OWNER_ADMIN') => setAudience(value)}
            >
              <SelectTrigger id="audience" className="w-full">
                <SelectValue placeholder="Selecciona audiencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OWNER">Solo Owner</SelectItem>
                <SelectItem value="ADMIN">Solo Admin</SelectItem>
                <SelectItem value="OWNER_ADMIN">Owner + Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Asunto</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Ej: Novedades importantes de Tendo"
              maxLength={120}
            />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="message">Mensaje</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleLoadHtmlTemplate('base')}
                >
                  Plantilla base
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleLoadHtmlTemplate('commercial')}
                >
                  Plantilla comercial
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleLoadHtmlTemplate('operative')}
                >
                  Plantilla operativa
                </Button>
              </div>
            </div>
            <Textarea
              id="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Escribe el contenido que recibirán por correo..."
              className="min-h-32"
              maxLength={5000}
            />
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="space-y-1">
                <Label htmlFor="is-html">Permitir contenido HTML</Label>
                <p className="text-xs text-muted-foreground">
                  Si está activo, el mensaje se interpreta como HTML dentro del template corporativo.
                </p>
              </div>
              <Switch
                id="is-html"
                checked={isHtml}
                onCheckedChange={setIsHtml}
              />
            </div>
          </div>

          <Button type="submit" disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar campaña
              </>
            )}
          </Button>
        </form>

        {result && (
          <div className="mt-4 rounded-md border bg-muted/40 p-3 text-sm">
            <p className="font-medium">Resultado del envío</p>
            <p>Destinatarios detectados: {result.recipients}</p>
            <p>Enviados: {result.sentCount}</p>
            <p>Fallidos: {result.failedCount}</p>
          </div>
        )}

        {(subject.trim().length > 0 || message.trim().length > 0) && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Vista previa del email</p>
            <div className="rounded-md border bg-[#f3f4f6] p-4">
              <div className="mx-auto max-w-[620px] overflow-hidden rounded-md border bg-white">
                <div className="border-b border-[#1c193b] bg-[#221f47] px-6 py-3">
                  <img
                    src="/tendo_sin_fondo/logo_negativo.svg"
                    alt="Tendo"
                    className="h-auto w-[150px] max-w-full"
                  />
                </div>
                <div className="space-y-3 px-6 py-5">
                  <h3 className="text-[22px] font-semibold leading-tight text-[#111827]">
                    {previewSubject}
                  </h3>
                  <p className="text-sm leading-6 text-[#1f2937]">
                    Tienes un nuevo mensaje del equipo Tendo.
                  </p>

                  {isHtml ? (
                    <div
                      className="text-sm leading-6 text-[#1f2937]"
                      dangerouslySetInnerHTML={{ __html: message }}
                    />
                  ) : (
                    <div className="space-y-2 text-sm leading-6 text-[#1f2937]">
                      {previewPlainTextParagraphs.length > 0 ? (
                        previewPlainTextParagraphs.map((paragraph, index) => (
                          <p key={`${paragraph}-${index}`}>{paragraph}</p>
                        ))
                      ) : (
                        <p className="text-muted-foreground">Escribe un mensaje para ver la vista previa.</p>
                      )}
                    </div>
                  )}

                  <div className="pt-1">
                    <span className="inline-flex rounded-md bg-[#111827] px-4 py-2 text-sm font-semibold text-white">
                      Ir al panel de administración
                    </span>
                  </div>

                  <p className="text-xs leading-5 text-[#6b7280]">
                    Si necesitas ayuda, responde este correo y nuestro equipo te apoyará.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
