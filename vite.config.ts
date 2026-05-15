import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const envValue = (key: string) => JSON.stringify(env[key] ?? '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
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
