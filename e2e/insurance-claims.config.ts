import { defineConfig } from '@playwright/test';
import { baseConfig } from './shared.config';

export default defineConfig({
  ...baseConfig,
  testDir: '.',
  testMatch: 'insurance-claims.spec.ts',
  use: { ...baseConfig.use, baseURL: process.env.BASE_URL || 'http://localhost:3000' },
});
