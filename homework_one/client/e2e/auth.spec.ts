import { expect, test } from '@playwright/test';
import { uniqueEmail } from './helpers';

test.describe('auth flow', () => {
  test('register → welcome with greeting and stats', async ({ page }) => {
    const email = uniqueEmail('register');
    await page.goto('/');

    await page.getByLabel(/full name/i).fill('Jane Doe');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password$/i).fill('Pass123');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByRole('heading', { name: /welcome,/i })).toBeVisible();
    await expect(page.locator('.w-title .l2')).toHaveText('Jane.');
    await expect(page.getByText('Workspace', { exact: true })).toBeVisible();
    await expect(page.getByText('jane-hq')).toBeVisible();
    await expect(page.getByText('0', { exact: true }).first()).toBeVisible(); // drafts
  });

  test('sign out returns to auth screen', async ({ page }) => {
    const email = uniqueEmail('signout');
    await page.goto('/');
    await page.getByLabel(/full name/i).fill('Sam Test');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password$/i).fill('Pass123');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByRole('heading', { name: /welcome,/i })).toBeVisible();

    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
  });

  test('sign in with correct password lands on welcome', async ({ page }) => {
    const email = uniqueEmail('signin');
    await page.goto('/');
    await page.getByLabel(/full name/i).fill('Liz Test');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password$/i).fill('Pass123');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByRole('heading', { name: /welcome,/i })).toBeVisible();
    await page.getByRole('button', { name: /sign out/i }).click();

    await page.getByRole('tab', { name: /sign in/i }).click();
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password$/i).fill('Pass123');
    await page.getByRole('button', { name: /^sign in$/i }).click();

    await expect(page.getByRole('heading', { name: /welcome,/i })).toBeVisible();
  });

  test('sign in with wrong password shows "doesn\'t match our records"', async ({ page }) => {
    const email = uniqueEmail('wrong');
    await page.goto('/');
    await page.getByLabel(/full name/i).fill('Pat Test');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password$/i).fill('Pass123');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByRole('heading', { name: /welcome,/i })).toBeVisible();
    await page.getByRole('button', { name: /sign out/i }).click();

    await page.getByRole('tab', { name: /sign in/i }).click();
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password$/i).fill('WrongPass');
    await page.getByRole('button', { name: /^sign in$/i }).click();

    await expect(page.getByRole('alert')).toContainText(/doesn't match our records/i);
    // Card stays on auth screen.
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('re-register same email → inline 409 + "Switch to Sign in" pre-fills email', async ({ page }) => {
    const email = uniqueEmail('dup');
    await page.goto('/');

    // First registration — succeeds.
    await page.getByLabel(/full name/i).fill('First Try');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password$/i).fill('Pass123');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByRole('heading', { name: /welcome,/i })).toBeVisible();
    await page.getByRole('button', { name: /sign out/i }).click();

    // Second registration with same email — expect inline 409.
    await page.getByLabel(/full name/i).fill('Second Try');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password$/i).fill('Pass456');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText(/that email is already in use/i)).toBeVisible();

    // Click "Switch to Sign in" — email field should be pre-filled.
    await page.getByRole('button', { name: /switch to sign in/i }).click();
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toHaveValue(email);
  });
});
