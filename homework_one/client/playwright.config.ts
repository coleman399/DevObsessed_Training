import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false, // backend writes to a shared DB; serial keeps emails deterministic
  retries: isCI ? 2 : 0,
  reporter: isCI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: devices['Desktop Chrome'],
      // Mobile-only specs are filtered out — only the mobile project runs them.
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: 'chromium-mobile',
      // iPhone presets force WebKit; we run mobile viewport under Chromium-Android instead
      // (Pixel 7 is a Chromium-based preset with mobile UA + touch).
      use: devices['Pixel 7'],
      grep: /@mobile|mobile\.spec\.ts/,
    },
  ],
  webServer: [
    {
      command: 'dotnet run --project ../src/WelcomeApp.Api --no-launch-profile --urls http://localhost:5000',
      url: 'http://localhost:5000/health',
      reuseExistingServer: !isCI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        ASPNETCORE_ENVIRONMENT: 'Development',
        ConnectionStrings__Default:
          'Server=(localdb)\\MSSQLLocalDB;Database=sqldb-welcomeapp-e2e;Trusted_Connection=True;TrustServerCertificate=True;',
        // Throwaway HMAC key for the e2e DB only — never used to sign anything outside the
        // sqldb-welcomeapp-e2e store. Mirrors the pattern in tests/WelcomeApp.Api.Tests/Infrastructure/ApiFactory.cs.
        // Real dev/prod keys live in dotnet user-secrets.
        Jwt__Key: 'playwright-e2e-key-never-sign-real-tokens-with-this-1234',
      },
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !isCI,
      timeout: 60_000,
    },
  ],
});
