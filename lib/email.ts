interface ResendEmailRequest {
  from: string;
  to: string[];
  subject: string;
  html: string;
}

interface TeamInvitationEmailInput {
  toEmail: string;
  organizationName: string;
  role: 'ADMIN' | 'MEMBER';
  invitationToken: string;
  expiresAt: Date;
}

interface TenantWelcomeEmailInput {
  toEmail: string;
  organizationName: string;
  temporaryPassword: string;
}

interface UserWelcomeEmailInput {
  toEmail: string;
  name?: string | null;
}

interface OrganizationCreatedEmailInput {
  toEmail: string;
  name?: string | null;
  organizationName: string;
}

interface AdminBroadcastEmailInput {
  toEmail: string;
  subject: string;
  message: string;
  isHtml?: boolean;
}

interface EmailTemplateInput {
  title: string;
  greeting: string;
  paragraphs: string[];
  ctaLabel: string;
  ctaUrl: string;
  supportMessage?: string;
}

function getBaseUrl() {
  return process.env.NEXTAUTH_URL || 'http://localhost:3000';
}

function getEmailLogoUrl() {
  const explicitLogo = process.env.MARKETING_EMAIL_LOGO_URL;
  if (explicitLogo) {
    return explicitLogo;
  }

  const baseUrl = getBaseUrl();
  if (baseUrl.includes('localhost')) {
    return null;
  }

  return `${baseUrl}/tendo_sin_fondo/logo_negativo.svg`;
}

function getSender() {
  const sender = process.env.RESEND_FROM_EMAIL;

  if (!sender) {
    throw new Error(
      'RESEND_FROM_EMAIL no está configurado. Ejemplo: "Tendo <no-reply@tendo.cl>"'
    );
  }

  return sender;
}

async function sendWithResend(payload: ResendEmailRequest) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY no está configurada');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();

    if (response.status === 403 && errorText.includes('You can only send testing emails')) {
      throw new Error(
        'Resend en modo testing: verifica tu dominio en resend.com/domains y usa RESEND_FROM_EMAIL con ese dominio verificado.'
      );
    }

    throw new Error(`Resend error ${response.status}: ${errorText}`);
  }

  return response.json();
}

function renderEmailTemplate(input: EmailTemplateInput) {
  const logoUrl = getEmailLogoUrl();
  const supportMessage =
    input.supportMessage ||
    'Si necesitas ayuda, responde este correo y nuestro equipo te apoyará.';

  const paragraphsHtml = input.paragraphs.map((paragraph) => `<p style="margin:0 0 12px 0;color:#1f2937;font-size:15px;line-height:1.6;">${paragraph}</p>`).join('');

  return `
    <div style="background:#f3f4f6;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:16px 24px;background:#221f47;border-bottom:1px solid #1c193b;">
            ${logoUrl ? `<img src="${logoUrl}" alt="Tendo" style="width:150px;max-width:100%;height:auto;display:block;" />` : `<p style="margin:0;color:#f7f7f8;font-size:22px;font-weight:700;letter-spacing:-0.02em;line-height:1;">Tendo</p>`}
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            <h2 style="margin:0 0 14px 0;font-size:22px;line-height:1.3;color:#111827;">${input.title}</h2>
            <p style="margin:0 0 12px 0;color:#1f2937;font-size:15px;line-height:1.6;">${input.greeting}</p>
            ${paragraphsHtml}
            <div style="margin:22px 0 18px 0;">
              <a href="${input.ctaUrl}" style="display:inline-block;padding:10px 16px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
                ${input.ctaLabel}
              </a>
            </div>
            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">${supportMessage}</p>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeMessageToParagraphs(message: string) {
  return message
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
    .map((paragraph) => escapeHtml(paragraph).replace(/\n/g, '<br />'));
}

export async function sendTeamInvitationEmail(input: TeamInvitationEmailInput) {
  const invitationUrl = `${getBaseUrl()}/register?invitationToken=${input.invitationToken}`;

  return sendWithResend({
    from: getSender(),
    to: [input.toEmail],
    subject: `Invitación a ${input.organizationName} en Tendo`,
    html: renderEmailTemplate({
      title: 'Te invitaron a Tendo',
      greeting: `Recibiste una invitación para unirte a ${input.organizationName}.`,
      paragraphs: [
        `Tu rol asignado es <strong>${input.role}</strong>.`,
        `Esta invitación vence el <strong>${input.expiresAt.toLocaleDateString('es-CL')}</strong>.`,
        `Si el botón no funciona, copia y pega este enlace en tu navegador:<br /><a href="${invitationUrl}" style="color:#2563eb;">${invitationUrl}</a>`,
      ],
      ctaLabel: 'Aceptar invitación',
      ctaUrl: invitationUrl,
    }),
  });
}

export async function sendTenantWelcomeEmail(input: TenantWelcomeEmailInput) {
  const loginUrl = `${getBaseUrl()}/login`;

  return sendWithResend({
    from: getSender(),
    to: [input.toEmail],
    subject: `Acceso inicial a ${input.organizationName} en Tendo`,
    html: renderEmailTemplate({
      title: 'Tu acceso inicial está listo',
      greeting: `Ya puedes ingresar a <strong>${input.organizationName}</strong> en Tendo.`,
      paragraphs: [
        `<strong>Correo:</strong> ${input.toEmail}`,
        `<strong>Contraseña temporal:</strong> ${input.temporaryPassword}`,
        'Por seguridad, cambia tu contraseña en tu primer inicio de sesión.',
      ],
      ctaLabel: 'Ir a iniciar sesión',
      ctaUrl: loginUrl,
    }),
  });
}

export async function sendUserWelcomeEmail(input: UserWelcomeEmailInput) {
  const onboardingUrl = `${getBaseUrl()}/onboarding`;
  const firstName = input.name?.trim().split(' ')[0] || 'Hola';

  return sendWithResend({
    from: getSender(),
    to: [input.toEmail],
    subject: 'Bienvenido(a) a Tendo — Activa tu cuenta',
    html: renderEmailTemplate({
      title: '¡Bienvenido(a) a Tendo!',
      greeting: `${firstName}, tu cuenta ya está creada y lista para comenzar.`,
      paragraphs: ['Para partir rápido, completa tu configuración inicial en pocos pasos.'],
      ctaLabel: 'Ir al onboarding',
      ctaUrl: onboardingUrl,
    }),
  });
}

export async function sendOrganizationCreatedEmail(input: OrganizationCreatedEmailInput) {
  const dashboardUrl = `${getBaseUrl()}/dashboard`;
  const firstName = input.name?.trim().split(' ')[0] || 'Hola';

  return sendWithResend({
    from: getSender(),
    to: [input.toEmail],
    subject: 'Tu organización en Tendo está lista — Ingresa al panel',
    html: renderEmailTemplate({
      title: 'Tu organización quedó lista',
      greeting: `${firstName}, creamos correctamente <strong>${input.organizationName}</strong> en Tendo.`,
      paragraphs: [
        'Ya puedes entrar al panel y comenzar a configurar productos, clientes y ventas.',
        'Te recomendamos revisar Configuración para dejar todo al día.',
      ],
      ctaLabel: 'Ir al dashboard',
      ctaUrl: dashboardUrl,
    }),
  });
}

export async function sendAdminBroadcastEmail(input: AdminBroadcastEmailInput) {
  const dashboardUrl = `${getBaseUrl()}/admin`;
  const paragraphs = input.isHtml
    ? [input.message]
    : normalizeMessageToParagraphs(input.message);

  return sendWithResend({
    from: getSender(),
    to: [input.toEmail],
    subject: input.subject,
    html: renderEmailTemplate({
      title: input.subject,
      greeting: 'Tienes un nuevo mensaje del equipo Tendo.',
      paragraphs,
      ctaLabel: 'Ir al panel de administración',
      ctaUrl: dashboardUrl,
    }),
  });
}