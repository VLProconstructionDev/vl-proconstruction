import * as Sentry from '@sentry/astro';

// Client-side (browser) error monitoring. The DSN is public by design — it only
// permits sending events to this project, so it's safe to ship in the bundle.
Sentry.init({
  dsn: 'https://8cec2cd9e1c28c7da56ad58216f213a2@o4512055374381056.ingest.us.sentry.io/4512055378444288',
  // Tags each event so production issues are easy to separate from local dev
  // in the Sentry dashboard (filter: environment:production).
  environment: import.meta.env.PROD ? 'production' : 'development',
});
