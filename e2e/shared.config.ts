import { defineConfig, devices } from '@playwright/test';

/**
 * Shared base config for all dashboard CI tests.
 * Each site config extends this with its own testDir and baseURL.
 */
export const baseConfig = {
  fullyParallel: true,
  workers: 1,
  retries: 1,
  reporter: [['list']] as const,
  use: {
    headless: true,
    screenshot: 'only-on-failure' as const,
    navigationTimeout: 30000,
    actionTimeout: 15000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
};
