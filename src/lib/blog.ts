import type { CollectionEntry } from 'astro:content';

/** Posts newer than this wear the "New" badge on cards. */
const NEW_FOR_DAYS = 60;

/** ~200 wpm, rounded up — matches how every other blog counts it. */
export function readTime(body: string | undefined): string {
  const words = (body ?? '').trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

export function isNew(publishedAt: Date, now = new Date()): boolean {
  return (now.getTime() - publishedAt.getTime()) / 86_400_000 <= NEW_FOR_DAYS;
}

/** "August 2026" — cards show the month, post pages the full date. */
export const monthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
export const fullDate = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

/**
 * Newest first, drafts hidden in production only (so a draft is reviewable on
 * `npm run dev` but never ships).
 */
export function sortPosts(posts: CollectionEntry<'blog'>[]): CollectionEntry<'blog'>[] {
  return [...posts].sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime(),
  );
}

export const visible = ({ data }: CollectionEntry<'blog'>) =>
  import.meta.env.PROD ? !data.draft : true;
