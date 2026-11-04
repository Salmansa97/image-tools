/**
 * Single source of truth for anything that appears in metadata, structured data
 * or the sitemap. Change `SITE_ORIGIN` when deploying to a different domain and
 * regenerate the sitemap with `npm run build`.
 */
export const SITE_ORIGIN = 'https://imagetools.app';

export const SITE_NAME = 'ImageTools';

export const SITE_TAGLINE = 'All Your Image Tools in One Place';

export const SITE_DESCRIPTION =
  'Compress, resize, crop and convert images online for free. Fast, secure and completely private — every image is processed inside your browser.';

/** Social sharing image served from `public/`. */
export const SITE_OG_IMAGE = '/og-image.svg';

export const SITE_LOCALE = 'en_US';

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalised = path.startsWith('/') ? path : `/${path}`;
  // Canonicals never carry a trailing slash, except for the home page.
  const trimmed =
    normalised !== '/' && normalised.endsWith('/') ? normalised.slice(0, -1) : normalised;
  return `${SITE_ORIGIN}${trimmed}`;
}
