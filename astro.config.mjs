// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import sitemap from '@astrojs/sitemap';
import sentry from '@sentry/astro';
import tailwindcss from '@tailwindcss/vite';

// astro.config.mjs runs before Vite loads .env, so process.env has no
// SENTRY_AUTH_TOKEN locally. loadEnv('', '') reads every var from .env here;
// on Cloudflare Pages the token comes from the build env var instead.
const { SENTRY_AUTH_TOKEN } = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');

// Production domain. Feeds canonicals, og:url, sitemap, and JSON-LD.
// Fully static output (no adapter) — deployed on Cloudflare Pages,
// which serves `dist/` as-is (build: npm run build, output: dist).
const SITE = 'https://vlproco.com';

export default defineConfig({
  site: SITE,
  // 'ignore' so both `/foo` and `/foo/` resolve in dev (and Astro's dev
  // server doesn't hard-404 the non-slash form). Canonicals + sitemap still
  // emit the trailing form (directory build + explicit paths in src/lib/urls),
  // and internal links all use it — so the "Page with redirect" fix holds
  // without the dev-server strictness that 'always' would impose.
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
    // Inline all CSS into the HTML — the two small stylesheets were the last
    // render-blocking requests (fonts are self-hosted @font-face already).
    inlineStylesheets: 'always',
  },
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
    }),
    // Browser error monitoring. This is a static site (no SSR adapter), so only
    // the client SDK runs at runtime — sentry.server.config.js is inert but kept
    // so server errors are captured automatically if an adapter is ever added.
    // Source maps upload at build time when SENTRY_AUTH_TOKEN is set (locally via
    // .env, and as a build env var in the Cloudflare Pages project). Without the
    // token the plugin just skips the upload — the build still succeeds.
    sentry({
      project: 'javascript-astro',
      org: 'vl-pro',
      authToken: process.env.SENTRY_AUTH_TOKEN ?? SENTRY_AUTH_TOKEN,
      // Upload source maps to Sentry (readable stack traces) but delete them
      // from dist/ afterwards so they aren't served publicly on the site.
      sourcemaps: {
        filesToDeleteAfterUpload: ['./dist/**/*.map'],
      },
    }),
  ],
  vite: {
    // Vite is duplicated between astro and @tailwindcss/vite in nested node_modules,
    // which trips TS's structural-identity check even though runtime is fine.
    plugins: [/** @type {any} */ (tailwindcss())],
  },
});
