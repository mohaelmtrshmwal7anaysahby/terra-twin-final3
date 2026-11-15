import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type {Plugin} from 'vite';
import {defineConfig} from 'vitest/config';

/** Fills %SITE_URL% (absolute origin + base path) so social crawlers get absolute og:image URLs. */
const siteUrl = (): Plugin => ({
  name: 'terratwin-site-url',
  transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', process.env.SITE_URL ?? './'),
});

export default defineConfig({
  // Relative base so the build works under a GitHub Pages sub-path (/<repo>/).
  base: './',
  plugins: [react(), tailwindcss(), siteUrl()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test-setup.ts'],
  },
});
