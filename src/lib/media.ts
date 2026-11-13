import { staticFile } from 'remotion';

/**
 * Resolves asset paths cleanly across both:
 * 1) Vite Dev/Prod `<Player>` (serves `public/` from `/...`)
 * 2) Remotion CLI / `@remotion/renderer` (serves `public/` via `staticFile(...)`)
 */
export const resolveMediaSrc = (src: string): string => {
  if (!src) return '';
  if (/^(https?:|data:|blob:)/.test(src)) {
    return src;
  }
  const clean = src.replace(/^\/+/, '');
  if (typeof window !== 'undefined' && window.remotion_staticBase) {
    return staticFile(clean);
  }
  return `/${clean}`;
};
