import 'dotenv/config';

interface CheckResult {
  name: string;
  endpoint: string;
  expectedStatus: number;
  actualStatus: number;
  ok: boolean;
  note?: string;
}

const baseUrl = process.env.SMOKE_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
const smokeEmail = process.env.SMOKE_EMAIL;
const smokePassword = process.env.SMOKE_PASSWORD;

function normalizeSetCookie(raw: string | null) {
  if (!raw) return '';
  return raw
    .split(/,(?=[^;]+=[^;]+)/g)
    .map((cookie) => cookie.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
}

function mergeCookies(...cookies: Array<string | null | undefined>) {
  const cookieMap = new Map<string, string>();

  for (const entry of cookies) {
    if (!entry) continue;
    for (const fragment of entry.split('; ')) {
      const [name, ...rest] = fragment.split('=');
      if (!name || rest.length === 0) continue;
      cookieMap.set(name, `${name}=${rest.join('=')}`);
    }
  }

  return Array.from(cookieMap.values()).join('; ');
}

async function runCheck(
  name: string,
  endpoint: string,
  expectedStatus: number,
  cookieHeader?: string
): Promise<CheckResult> {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
      cache: 'no-store',
    });

    return {
      name,
      endpoint,
      expectedStatus,
      actualStatus: response.status,
      ok: response.status === expectedStatus,
    };
  } catch (error) {
    return {
      name,
      endpoint,
      expectedStatus,
      actualStatus: 0,
      ok: false,
      note: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

async function signInForSmoke() {
  if (!smokeEmail || !smokePassword) {
    return {
      ok: false,
      cookie: '',
      reason:
        'SMOKE_EMAIL/SMOKE_PASSWORD no configurados. Se ejecutarán solo pruebas públicas.',
    };
  }

  const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`, { cache: 'no-store' });

  if (!csrfResponse.ok) {
    return {
      ok: false,
      cookie: '',
      reason: `No se pudo obtener CSRF token (${csrfResponse.status})`,
    };
  }

  const csrfBody = (await csrfResponse.json()) as { csrfToken?: string };
  if (!csrfBody.csrfToken) {
    return {
      ok: false,
      cookie: '',
      reason: 'Respuesta CSRF inválida',
    };
  }

  const csrfCookie = normalizeSetCookie(csrfResponse.headers.get('set-cookie'));

  const formData = new URLSearchParams({
    csrfToken: csrfBody.csrfToken,
    email: smokeEmail,
    password: smokePassword,
    callbackUrl: `${baseUrl}/dashboard`,
    redirect: 'false',
    json: 'true',
  });

  const loginResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: csrfCookie,
    },
    body: formData.toString(),
    redirect: 'manual',
    cache: 'no-store',
  });

  const loginCookie = normalizeSetCookie(loginResponse.headers.get('set-cookie'));
  const combinedCookie = mergeCookies(csrfCookie, loginCookie);

  if (!combinedCookie) {
    return {
      ok: false,
      cookie: '',
      reason: `No se obtuvo cookie de sesión (${loginResponse.status})`,
    };
  }

  const sessionCheck = await fetch(`${baseUrl}/api/dashboard/kpis`, {
    headers: { Cookie: combinedCookie },
    cache: 'no-store',
  });

  if (sessionCheck.status === 401 || sessionCheck.status === 403) {
    return {
      ok: false,
      cookie: '',
      reason: 'Login de smoke inválido: credenciales sin sesión activa',
    };
  }

  return {
    ok: true,
    cookie: combinedCookie,
    reason: 'Autenticación smoke OK',
  };
}

async function main() {
  console.log(`🔎 Smoke API - Base URL: ${baseUrl}`);

  const results: CheckResult[] = [];

  results.push(await runCheck('Health check', '/api/health', 200));

  const authResult = await signInForSmoke();
  console.log(authResult.ok ? '✅ ' + authResult.reason : '⚠️  ' + authResult.reason);

  if (authResult.ok) {
    const authChecks: Array<[string, string]> = [
      ['KPIs dashboard', '/api/dashboard/kpis'],
      ['Créditos', '/api/credits'],
      ['Servicios proyectos', '/api/services/projects'],
      ['Team members', '/api/team/members'],
      ['Settings', '/api/settings'],
    ];

    for (const [name, endpoint] of authChecks) {
      results.push(await runCheck(name, endpoint, 200, authResult.cookie));
    }
  }

  console.log('\n📋 Resultados:');
  for (const result of results) {
    const mark = result.ok ? '✅' : '❌';
    const detail = `${result.actualStatus}/${result.expectedStatus}`;
    console.log(`${mark} ${result.name} (${result.endpoint}) -> ${detail}${result.note ? ` | ${result.note}` : ''}`);
  }

  const failed = results.filter((result) => !result.ok);
  if (failed.length > 0) {
    console.error(`\n❌ Smoke tests fallidos: ${failed.length}`);
    process.exit(1);
  }

  if (!authResult.ok) {
    console.log('\n⚠️  Smoke parcial completado: faltan verificaciones autenticadas.');
    process.exit(0);
  }

  console.log('\n✅ Smoke completo exitoso.');
}

main().catch((error) => {
  console.error('❌ Error ejecutando smoke tests:', error);
  process.exit(1);
});