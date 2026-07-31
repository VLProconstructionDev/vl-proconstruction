// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Update SITE when the production domain is finalized.
// Fully static output (no adapter) — deployed on Cloudflare Pages,
// which serves `dist/` as-is (build: npm run build, output: dist).
const SITE = 'https://vl-proconstruction.pages.dev';

export default defineConfig({
  site: SITE,
  // 'ignore' so both `/foo` and `/foo/` work in dev and in prod.
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
    }),
  ],
  vite: {
    // Vite is duplicated between astro and @tailwindcss/vite in nested node_modules,
    // which trips TS's structural-identity check even though runtime is fine.
    plugins: [/** @type {any} */ (tailwindcss())],
  },
});
