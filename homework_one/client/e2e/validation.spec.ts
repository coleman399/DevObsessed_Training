import { expect, test } from '@playwright/test';

test.describe('inline form validation', () => {
  test('invalid email after blur shows the warn icon + error copy', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/email/i).fill('not-an-email');
    await page.getByLabel(/email/i).blur();
    await expect(page.getByText(/that doesn't look right/i)).toBeVisible();
  });

  test('submit stays disabled while password is short', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/full name/i).fill('Jane');
    await page.getByLabel(/email/i).fill('jane@example.com');
    await page.getByLabel(/^password$/i).fill('abc'); // 3 chars
    await expect(page.getByRole('button', { name: /create account/i })).toBeDisabled();
  });

  test('password strength bars and label update across tiers', async ({ page }) => {
    await page.goto('/');
    const passwordInput = page.getByLabel(/^password$/i);

    // Each lit bar carries the on-{strength} class, so the count of `.on-N` bars equals N
    // and the unlit bars carry an empty class.

    // Tier 1: length ≥ 6 only.
    await passwordInput.fill('abcdef');
    await expect(page.locator('.strength i.on-1')).toHaveCount(1);
    await expect(page.locator('.strength-label')).toHaveText(/weak/i);

    // Tier 2: + length ≥ 10.
    await passwordInput.fill('abcdefghij');
    await expect(page.locator('.strength i.on-2')).toHaveCount(2);
    await expect(page.locator('.strength-label')).toHaveText(/fair/i);

    // Tier 3: + upper + lower.
    await passwordInput.fill('AbcDefGhij');
    await expect(page.locator('.strength i.on-3')).toHaveCount(3);
    await expect(page.locator('.strength-label')).toHaveText(/good/i);

    // Tier 4: + digit + special.
    await passwordInput.fill('AbcDef1!ij');
    await expect(page.locator('.strength i.on-4')).toHaveCount(4);
    await expect(page.locator('.strength-label')).toHaveText(/strong/i);
  });
});
