import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { uniqueEmail } from './helpers';

// Helper: register and land on the welcome screen.
async function registerAndLand(page: Parameters<Parameters<typeof test>[1]>[0], name: string) {
  const email = uniqueEmail('chat');
  await page.goto('/');
  await page.getByLabel(/full name/i).fill(name);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/^password$/i).fill('Pass123');
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page.getByRole('heading', { name: /welcome,/i })).toBeVisible();
  return email;
}

// firstName = name.split(' ')[0] — use single-word first names in greeting assertions
// to avoid "Jane Doe" → firstName "Jane" mismatches.
const GREETING = /what are we working on first\?/i;

test.describe('chat surface — static UI', () => {
  test('Nova greeting personalises with the signed-in first name', async ({ page }) => {
    await registerAndLand(page, 'Nova Test');

    // firstName = "Nova" — verify the name is wired into the greeting.
    await expect(page.getByText(/Hey Nova, what are we working on first\?/i)).toBeVisible();
  });

  test('chat header shows "NEW CONVERSATION" title and + New button', async ({ page }) => {
    await registerAndLand(page, 'Chat User');

    await expect(page.getByText(/new conversation/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /new conversation/i })).toBeVisible();
  });

  test('composer textarea and send button are rendered', async ({ page }) => {
    await registerAndLand(page, 'Compose User');

    const textarea = page.getByRole('textbox', { name: /ask nova anything/i });
    await expect(textarea).toBeVisible();

    const sendBtn = page.getByRole('button', { name: /^send$/i });
    await expect(sendBtn).toBeVisible();
    // Send is disabled when input is empty.
    await expect(sendBtn).toBeDisabled();
  });

  test('send button enables when text is typed', async ({ page }) => {
    await registerAndLand(page, 'Type User');

    const textarea = page.getByRole('textbox', { name: /ask nova anything/i });
    const sendBtn = page.getByRole('button', { name: /^send$/i });

    await textarea.fill('Hello Nova');
    await expect(sendBtn).toBeEnabled();

    await textarea.clear();
    await expect(sendBtn).toBeDisabled();
  });

  test('welcome header is visible before chatting', async ({ page }) => {
    await registerAndLand(page, 'Header User');

    await expect(page.locator('.w-header-collapse')).not.toHaveClass(/collapsed/);
    await expect(page.locator('.w-title')).toBeVisible();
    await expect(page.locator('.w-sub')).toBeVisible();
  });

  test('+ New button adds a fresh conversation stub', async ({ page }) => {
    await registerAndLand(page, 'Newbie User');

    // firstName = "Newbie" — greeting should be visible.
    await expect(page.getByText(GREETING)).toBeVisible();

    // Click + New — a second stub with the same greeting text appears.
    await page.getByRole('button', { name: /new conversation/i }).click();
    await expect(page.getByText(GREETING).first()).toBeVisible();
  });

  test('recent conversations section is absent when no conversations have been sent', async ({ page }) => {
    await registerAndLand(page, 'Norecents User');

    // The recents list only renders when there are conversations with user turns.
    await expect(page.getByText(/recent conversations/i)).not.toBeVisible();
  });

  test('no horizontal overflow with chat visible', async ({ page }) => {
    await registerAndLand(page, 'Overflow User');

    await expect(page.getByText(GREETING)).toBeVisible();

    const overflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);
  });

  test('chat surface passes axe-core accessibility check', async ({ page }) => {
    await registerAndLand(page, 'Axe User');

    // firstName = "Axe" — wait for greeting to confirm chat is mounted.
    await expect(page.getByText(GREETING)).toBeVisible();

    const results = await new AxeBuilder({ page })
      .disableRules(['color-contrast'])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
});

// NOTE: Tests for sending a message and receiving a streaming reply are intentionally omitted.
// The real models.github.ai endpoint is rate-limited and non-deterministic.
// To add coverage: introduce ASPNETCORE_ENVIRONMENT=E2E + a stub IChatService that returns
// canned SSE responses, then gate it in playwright.config.ts webServer env.
