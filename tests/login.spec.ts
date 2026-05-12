import { test, expect } from '@playwright/test';

// El ".serial" fuerza a Playwright a correr "Login exitoso" primero y "Login fallido" después.
test.describe.serial('Flujo de Login', () => {

  test('Login exitoso', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    await page.getByRole('textbox').first().fill('matiasleonel2895@gmail.com');
    await page.locator('input[type="password"]').fill('sinclair');
    await page.getByRole('button', { name: 'Iniciar Sesión', exact: true }).click();
    
    await expect(page.getByText('Sistema de Gestión de Tickets')).toBeVisible();
  });

  test('Login fallido', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    await page.getByRole('textbox').first().fill('matiasleonel2895@gmail.com');
    await page.locator('input[type="password"]').fill('shjclair');
    await page.getByRole('button', { name: 'Iniciar Sesión', exact: true }).click();
    
    await expect(page.getByText('Correo o contraseña incorrectos. Revisá tus datos.')).toBeVisible();
  });
});