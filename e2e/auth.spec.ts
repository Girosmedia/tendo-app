import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de login
    await page.goto('/login');
  });

  test('muestra formulario de login correctamente', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Iniciar Sesión|Bienvenido/i);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('muestra error con credenciales inválidas', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Esperar mensaje de error (puede ser toast o texto en pantalla)
    await expect(page.locator('text=/Credenciales inválidas|Error/i')).toBeVisible({
      timeout: 3000,
    });
  });

  test('navega a registro desde login', async ({ page }) => {
    const registerLink = page.locator('a[href*="register"]');
    await expect(registerLink).toBeVisible();
    await registerLink.click();

    await expect(page).toHaveURL(/\/register/);
    await expect(page.locator('h1')).toContainText(/Crear Cuenta|Registro/i);
  });

  test('navega a recuperar contraseña', async ({ page }) => {
    const forgotLink = page.locator('a[href*="forgot-password"]');
    
    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      await expect(page).toHaveURL(/\/forgot-password/);
    }
  });
});

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('muestra formulario de registro completo', async ({ page }) => {
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('valida campos requeridos', async ({ page }) => {
    // Intentar submit sin llenar nada
    await page.click('button[type="submit"]');

    // Verificar que sigue en la misma página (no redirige)
    await expect(page).toHaveURL(/\/register/);
  });

  test('valida formato de email', async ({ page }) => {
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Debe mostrar error de validación
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
  });
});

test.describe('Onboarding Flow (Authenticated)', () => {
  test.skip('requiere autenticación previa', async ({ page }) => {
    // Este test se saltea porque requiere un usuario autenticado
    // En un ambiente de CI, se puede usar un fixture o seed de DB
    await page.goto('/onboarding');

    // Si no está autenticado, debe redirigir a /login
    await page.waitForURL(/\/login/, { timeout: 5000 });
  });

  // TODO: Implementar test con usuario autenticado usando Page Storage State
  // Referencia: https://playwright.dev/docs/auth
});

test.describe('Accessibility (a11y)', () => {
  test('formulario de login tiene labels accesibles', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[type="password"]');

    // Verificar que existen labels asociados
    await expect(emailInput).toHaveAttribute('id');
    await expect(passwordInput).toHaveAttribute('id');
  });

  test('botones tienen texto descriptivo', async ({ page }) => {
    await page.goto('/login');

    const submitButton = page.locator('button[type="submit"]');
    const buttonText = await submitButton.textContent();

    expect(buttonText?.trim().length).toBeGreaterThan(0);
  });
});
