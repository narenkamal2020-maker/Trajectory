import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 60000,
    // Integration tests share one Oracle schema; run files sequentially.
    fileParallelism: false,
  },
});
