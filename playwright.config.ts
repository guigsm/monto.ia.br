import { defineConfig, devices } from '@playwright/test';

// 🌟 `astro preview` com o adapter Cloudflare serve via Wrangler.
// Se a porta real for diferente, exporte PLAYWRIGHT_BASE_URL antes de rodar
// `pnpm test:e2e` (ex.: PLAYWRIGHT_BASE_URL=http://localhost:8788).
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4321';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm preview',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
