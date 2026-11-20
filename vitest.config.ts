import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      // Line coverage of the logic in lib/. An include list also counts files
      // the tests never import. UI under app/ and components/ is covered by
      // Playwright, not by this unit suite.
      include: ['lib/**/*.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
