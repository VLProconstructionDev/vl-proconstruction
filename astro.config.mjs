// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// Update SITE when the production domain is finalized.
const SITE = 'https://vl-construction.vercel.app';

export default defineConfig({
  site: SITE,
  // 'ignore' so both `/foo` and `/foo/` work in dev and in prod.
  // The Vercel adapter still canonicalizes to no-trailing-slash for SEO.
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
  adapter: vercel({
    webAnalytics: { enabled: false },
    imageService: true,
  }),
  vite: {
    // Vite is duplicated between astro and @tailwindcss/vite in nested node_modules,
    // which trips TS's structural-identity check even though runtime is fine.
    plugins: [/** @type {any} */ (tailwindcss())],
  },
});
