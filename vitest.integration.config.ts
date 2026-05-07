import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    setupFiles: ['dotenv/config', 'tests/integration/setup.ts'],
    testTimeout: 20000,
    hookTimeout: 60000,
    pool: 'forks',
    fileParallelism: false,
  },
});
