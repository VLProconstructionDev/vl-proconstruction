# CLAUDE.md — Development Rules

## Project
- VL Proconstruction marketing website. Astro 5 static site (SSG), no backend.
- Live pages: Home, Services index, 3 service pages, 404. Blog + location pages are parked in `src/unreleased/` (see main CLAUDE.md).

## Local Dev (macOS)
- Node is available (`node --version` → v22+).
- Start the dev server: `npm run dev` → http://localhost:4321.
- Don't start a second instance if one is running.
- Type-check with `npm run check`; production build with `npm run build`.

## Code Conventions
- Astro pages/components — see the main CLAUDE.md for architecture and file layout.
- Shared markup (Header, Footer, EstimateWizard) lives in `src/components/` — never duplicate it per page.
- Page-specific CSS goes in `<style is:global>`, page-specific JS in `<script is:inline>`, within the page's `.astro` file.
- Placeholder images via `https://placehold.co/WIDTHxHEIGHT` until real photos are added to `public/assets/images/`.
- Mobile-first; verify at 375px, 768px, and 1440px widths.

## Content Placeholders (replace with real info)
- Street address/ZIP, license/insurance numbers, real project photos.
- Business info lives in `src/lib/site.ts` — TODOs are marked there.

## Don't
- Don't overwrite `claude-design.md` or `claude-development.md` without being asked.
