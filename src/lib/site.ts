/**
 * Single source of truth for site-wide business info.
 * Consumed by SEO/JSON-LD, footer, header CTAs, and location pages.
 */
export const site = {
  name: 'VL Proconstruction',
  // Legal name as it appears on the business's Google Maps listing.
  legalName: 'VL Proconstruction LLC',
  tagline: 'Custom Showers, Tile & Natural Stone, Hard-Surface Flooring',
  url: 'https://vlproco.com',
  logo: '/assets/images/favicon.png',
  phone: '(503) 781-4657',
  phoneHref: 'tel:+15037814657',
  email: 'info@vlproco.com',
  address: {
    // TODO: real street address + ZIP
    streetAddress: '',
    addressLocality: 'Bradenton',
    addressRegion: 'FL',
    postalCode: '',
    addressCountry: 'US',
  },
  geo: {
    // Bradenton, FL (approximate city center — TODO: exact business coords)
    latitude: 27.4989,
    longitude: -82.5748,
  },
  areaServed: [
    'Bradenton', 'Sarasota', 'Parrish', 'Manatee County', 'Sarasota County',
    'Ellenton', 'Palmetto', 'Lakewood Ranch', 'University Park', 'Nokomis',
    'Venice', 'Anna Maria', 'Holmes Beach', 'Bradenton Beach', 'Longboat Key',
    'Siesta Key',
  ],
  social: {
    instagram: 'https://www.instagram.com/vlproconstruction/',
    googleMaps: 'https://maps.app.goo.gl/7Yi5JeKD4vwVWFXo9',
  },
  // 1200×630 branded link-preview card (logo, tagline, 5.0-star proof).
  // JPG on purpose: FB/WhatsApp previews don't reliably render webp.
  // Regenerate from a browser screenshot if branding changes.
  defaultOgImage: '/assets/images/og-card.jpg',
  // Google Apps Script web-app URL that receives estimate-form leads
  // (appends to the client's Google Sheet + emails them). Setup guide:
  // docs/leads-webhook/SETUP.md. Empty = submissions log to console only.
  estimateWebhook:
    'https://script.google.com/macros/s/AKfycbwxOWdxPs1wkO4Plz4yW1b5dYqYnJdIQUY4HVdaNbz8A5__fMRpqeNeNW2Xe-nobgJqtg/exec',
  // Maps JS API key for the address-autocomplete on the estimate wizard.
  // Ships in the client bundle by design — MUST be restricted in Google Cloud
  // console to this site's domains + Maps JavaScript API / Places API only.
  // Empty = the address field works as a plain text input.
  googleMapsApiKey: 'AIzaSyDjbUshWhItxE8cqBRU_pTW9OjNh748CA4',
  // reCAPTCHA v3 site key (public by design; the SECRET key lives only in the
  // Apps Script — see docs/leads-webhook/SETUP.md). Register both at
  // https://www.google.com/recaptcha/admin/create (score-based v3).
  // Empty = reCAPTCHA disabled; the form still submits (honeypot only).
  recaptchaSiteKey: '6LcFm24tAAAAAF7U7lYEF_QPfWiLvZBsVo-Pac6H',
};

export type Site = typeof site;
