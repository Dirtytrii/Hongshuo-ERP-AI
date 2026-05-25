import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function manualChunks(id: string): string | undefined {
  const normalizedId = id.replace(/\\/g, '/');

  if (!normalizedId.includes('/node_modules/')) {
    return undefined;
  }

  if (
    normalizedId.includes('/node_modules/react/') ||
    normalizedId.includes('/node_modules/react-dom/') ||
    normalizedId.includes('/node_modules/scheduler/')
  ) {
    return 'vendor-react';
  }

  if (
    normalizedId.includes('/node_modules/recharts/') ||
    normalizedId.includes('/node_modules/d3-') ||
    normalizedId.includes('/node_modules/victory-vendor/') ||
    normalizedId.includes('/node_modules/decimal.js-light/')
  ) {
    return 'vendor-charts';
  }

  if (normalizedId.includes('/node_modules/xlsx/')) {
    return 'vendor-spreadsheet';
  }

  if (normalizedId.includes('/node_modules/lucide-react/') || normalizedId.includes('/node_modules/lucide/')) {
    return 'vendor-icons';
  }

  if (normalizedId.includes('/node_modules/@google/genai/')) {
    return 'vendor-ai';
  }

  return 'vendor-core';
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const envValue = (key: string) => JSON.stringify(env[key] ?? '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks,
        },
      },
    },
    define: {
      'process.env.API_KEY': envValue('GEMINI_API_KEY'),
      'process.env.GEMINI_API_KEY': envValue('GEMINI_API_KEY'),
      'process.env.DEEPSEEK_API_KEY': envValue('DEEPSEEK_API_KEY'),
      'process.env.OPENROUTER_BASE_URL': envValue('OPENROUTER_BASE_URL'),
      'process.env.OPENROUTER_FANS_BASE_URL': envValue('OPENROUTER_FANS_BASE_URL'),
      'process.env.OPENAI_COMPAT_BASE_URL': envValue('OPENAI_COMPAT_BASE_URL'),
      'process.env.OPENROUTER_API_KEY': envValue('OPENROUTER_API_KEY'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      include: ['**/*.{test,spec}.{ts,tsx}'],
      exclude: ['e2e/**', 'node_modules/**'],
    },
  };
});
