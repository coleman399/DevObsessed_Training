import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Sibling to vite.config.ts so dev and test configs stay cleanly separated.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    css: false,
    // Vitest's default glob picks up e2e/*.spec.ts; Playwright owns those.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
});
