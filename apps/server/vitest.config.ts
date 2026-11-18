import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    exclude: ['**/node_modules/**', '**/dist/**', '**/*_live.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/routes/auth.ts',
        'src/routes/scraper.ts',
        'src/routes/trading.ts',
        'src/services/sipCalculator.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        statements: 70,
      },
    },
  },
})
