import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    pool: 'vmThreads',
    include: ['src/tests/**/*.test.ts'],
  },
});
