import 'dotenv/config';

interface CheckResult {
  name: string;
  endpoint: string;
  expected: number[];
  actual: number;
  ok: boolean;
  note?: string;
}

interface LoginResult {
  ok: boolean;
  cookie: string;
  reason: string;
}

const baseUrl = process.env.SMOKE_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
const memberEmail = process.env.SMOKE_MEMBER_EMAIL || process.env.SMOKE_EMAIL;
const memberPassword = process.env.SMOKE_MEMBER_PASSWORD || process.env.SMOKE_PASSWORD;
const superAdminEmail = process.env.SMOKE_SUPERADMIN_EMAIL;
const superAdminPassword = process.env.SMOKE_SUPERADMIN_PASSWORD;
const strictMode = process.env.SMOKE_STRICT === 'true';

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

  for (const cookie of cookies) {
    if (!cookie) continue;
    for (const chunk of cookie.split('; ')) {
      const [name, ...rest] = chunk.split('=');
      if (!name || rest.length === 0) continue;
      cookieMap.set(name, `${name}=${rest.join('=')}`);
    }
  }

  return Array.from(cookieMap.values()).join('; ');
}

async function loginByCredentials(email?: string, password?: string): Promise<LoginResult> {
  if (!email || !password) {
    return {
      ok: false,
      cookie: '',
      reason: 'Credenciales no configuradas',
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

  const payload = new URLSearchParams({
    csrfToken: csrfBody.csrfToken,
    email,
    password,
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
    body: payload.toString(),
    redirect: 'manual',
    cache: 'no-store',
  });

  const loginCookie = normalizeSetCookie(loginResponse.headers.get('set-cookie'));
  const cookie = mergeCookies(csrfCookie, loginCookie);

  if (!cookie) {
    return {
      ok: false,
      cookie: '',
      reason: `No se obtuvo cookie de sesión (${loginResponse.status})`,
    };
  }

  return {
    ok: true,
    cookie,
    reason: 'Login exitoso',
  };
}

async function runCheck(
  name: string,
  endpoint: string,
  expected: number[],
  cookie?: string
): Promise<CheckResult> {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: cookie ? { Cookie: cookie } : undefined,
      cache: 'no-store',
    });

    return {
      name,
      endpoint,
      expected,
      actual: response.status,
      ok: expected.includes(response.status),
    };
  } catch (error) {
    return {
      name,
      endpoint,
      expected,
      actual: 0,
      ok: false,
      note: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

function printResult(result: CheckResult) {
  const mark = result.ok ? '✅' : '❌';
  console.log(
    `${mark} ${result.name} (${result.endpoint}) -> ${result.actual}/${result.expected.join('|')}${
      result.note ? ` | ${result.note}` : ''
    }`
  );
}

async function main() {
  console.log(`🔐 Smoke Seguridad - Base URL: ${baseUrl}`);

  const checks: CheckResult[] = [];

  // Baseline obligatorio sin autenticación
  checks.push(await runCheck('Dashboard KPIs requiere auth', '/api/dashboard/kpis', [401]));
  checks.push(await runCheck('Team members requiere auth', '/api/team/members', [401]));
  checks.push(await runCheck('Admin tenants requiere auth', '/api/admin/tenants', [401]));

  // Validación de rol MEMBER (opcional)
  const memberLogin = await loginByCredentials(memberEmail, memberPassword);
  if (memberLogin.ok) {
    checks.push(await runCheck('Member accede KPIs', '/api/dashboard/kpis', [200, 404], memberLogin.cookie));
    checks.push(await runCheck('Member denegado en admin tenants', '/api/admin/tenants', [403], memberLogin.cookie));
    checks.push(await runCheck('Member accede customers', '/api/customers', [200, 404], memberLogin.cookie));
    checks.push(
      await runCheck(
        'Isolation spot-check customer inexistente',
        '/api/customers/cuid_smoke_not_found',
        [404],
        memberLogin.cookie
      )
    );
  } else {
    console.log(`⚠️  MEMBER checks omitidos: ${memberLogin.reason}`);
  }

  // Validación SUPER_ADMIN (opcional)
  const superAdminLogin = await loginByCredentials(superAdminEmail, superAdminPassword);
  if (superAdminLogin.ok) {
    checks.push(await runCheck('Super admin accede admin tenants', '/api/admin/tenants', [200], superAdminLogin.cookie));
  } else {
    console.log(`⚠️  SUPER_ADMIN checks omitidos: ${superAdminLogin.reason}`);
  }

  console.log('\n📋 Resultados seguridad:');
  checks.forEach(printResult);

  const failed = checks.filter((check) => !check.ok);

  if (strictMode) {
    if (!memberLogin.ok || !superAdminLogin.ok) {
      console.error('\n❌ Modo estricto activo y faltan credenciales de rol para validación completa.');
      process.exit(1);
    }
  }

  if (failed.length > 0) {
    console.error(`\n❌ Checks fallidos: ${failed.length}`);
    process.exit(1);
  }

  console.log('\n✅ Smoke de seguridad completado.');
}

main().catch((error) => {
  console.error('❌ Error ejecutando smoke de seguridad:', error);
  process.exit(1);
});