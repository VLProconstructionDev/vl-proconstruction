import * as Sentry from '@sentry/astro';

// Server-side SDK. This site builds to static output (no SSR adapter), so this
// file does NOT run at runtime today — it's kept only so that if an SSR adapter
// is ever added, server-side errors are captured without extra setup. Safe to
// leave in place for the static build.
Sentry.init({
  dsn: 'https://8cec2cd9e1c28c7da56ad58216f213a2@o4512055374381056.ingest.us.sentry.io/4512055378444288',
  environment: import.meta.env.PROD ? 'production' : 'development',
});
