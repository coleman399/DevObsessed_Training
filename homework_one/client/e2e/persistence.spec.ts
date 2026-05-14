import { expect, test } from '@playwright/test';
import { uniqueEmail } from './helpers';

const STORAGE_KEY = 'devobsessed.auth.token';

test.describe('token storage + remember-me persistence', () => {
  test('remember-me checked → reload keeps user authenticated, token in localStorage', async ({
    page,
  }) => {
    const email = uniqueEmail('remember-on');
    await page.goto('/');

    // Register goes through Remember = true by default per useAuth.register.
    await page.getByLabel(/full name/i).fill('Persistent Pat');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password$/i).fill('Pass123');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByRole('heading', { name: /welcome,/i })).toBeVisible();

    const localToken = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
    const sessionToken = await page.evaluate((key) => window.sessionStorage.getItem(key), STORAGE_KEY);
    expect(localToken).not.toBeNull();
    expect(sessionToken).toBeNull();

    await page.reload();
    await expect(page.getByRole('heading', { name: /welcome,/i })).toBeVisible();
  });

  test('remember-me unchecked → token lives in sessionStorage, not localStorage', async ({
    page,
  }) => {
    const email = uniqueEmail('remember-off');
    // Register first so we have an account.
    await page.goto('/');
    await page.getByLabel(/full name/i).fill('Session Sam');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password$/i).fill('Pass123');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByRole('heading', { name: /welcome,/i })).toBeVisible();
    await page.getByRole('button', { name: /sign out/i }).click();

    // Sign in with Remember unchecked.
    await page.getByRole('tab', { name: /sign in/i }).click();
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password$/i).fill('Pass123');
    await page.getByLabel(/remember me/i).uncheck();
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await expect(page.getByRole('heading', { name: /welcome,/i })).toBeVisible();

    const localToken = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
    const sessionToken = await page.evaluate((key) => window.sessionStorage.getItem(key), STORAGE_KEY);
    expect(localToken).toBeNull();
    expect(sessionToken).not.toBeNull();
  });
});
