/**
 * Generates `sitemap.xml` from the pages the build actually prerendered.
 *
 * Deriving the sitemap from the build output rather than from a hand-kept list
 * means it can never drift: add a route, and the next build lists it; remove one,
 * and it disappears. Pages marked `noindex` (the 404) are never prerendered to a
 * real path, so they are excluded automatically.
 *
 * Usage: node scripts/generate-sitemap.mjs [outputDir]
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const browserDir = process.argv[2] ?? join(projectRoot, 'dist', 'image-tools', 'browser');

/** Per-route hints. Anything not listed falls back to the defaults below. */
const ROUTE_HINTS = {
  '/': { changefreq: 'weekly', priority: '1.0' },
  '/compress-image': { changefreq: 'weekly', priority: '0.9' },
  '/resize-image': { changefreq: 'weekly', priority: '0.9' },
  '/crop-image': { changefreq: 'weekly', priority: '0.9' },
  '/convert-image': { changefreq: 'weekly', priority: '0.9' },
  '/png-to-jpg': { changefreq: 'monthly', priority: '0.8' },
  '/jpg-to-png': { changefreq: 'monthly', priority: '0.8' },
  '/webp-converter': { changefreq: 'monthly', priority: '0.8' },
  '/tools': { changefreq: 'weekly', priority: '0.9' },
  '/rotate-image': { changefreq: 'monthly', priority: '0.8' },
  '/flip-image': { changefreq: 'monthly', priority: '0.8' },
  '/image-filters': { changefreq: 'monthly', priority: '0.8' },
  '/remove-background': { changefreq: 'weekly', priority: '0.9' },
  '/watermark-image': { changefreq: 'monthly', priority: '0.8' },
  '/favicon-generator': { changefreq: 'monthly', priority: '0.8' },
  '/social-media-image-resizer': { changefreq: 'monthly', priority: '0.8' },
  '/image-metadata-viewer': { changefreq: 'monthly', priority: '0.8' },
  '/remove-metadata': { changefreq: 'monthly', priority: '0.8' },
  '/image-color-picker': { changefreq: 'monthly', priority: '0.7' },
  '/image-to-base64': { changefreq: 'monthly', priority: '0.7' },
  '/about': { changefreq: 'monthly', priority: '0.5' },
  '/privacy-policy': { changefreq: 'yearly', priority: '0.3' },
};

/** Pages that render fine but should stay out of the index. */
const EXCLUDED = new Set(['/history']);

const DEFAULT_HINT = { changefreq: 'monthly', priority: '0.6' };

async function readOrigin() {
  const configPath = join(projectRoot, 'src', 'app', 'seo', 'site.config.ts');
  const source = await readFile(configPath, 'utf8');
  const match = source.match(/SITE_ORIGIN\s*=\s*['"]([^'"]+)['"]/);
  if (!match) {
    throw new Error(`Could not read SITE_ORIGIN from ${configPath}`);
  }
  return match[1].replace(/\/$/, '');
}

async function findPrerenderedRoutes(dir) {
  const routes = [];

  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      if (entry.name !== 'index.html') {
        continue;
      }
      const relativeDir = relative(dir, current);
      routes.push(relativeDir === '' ? '/' : `/${relativeDir.split(sep).join('/')}`);
    }
  }

  await walk(dir);
  return routes.sort((a, b) => a.localeCompare(b));
}

async function main() {
  if (!existsSync(browserDir)) {
    console.error(`[sitemap] Build output not found at ${browserDir}. Run "ng build" first.`);
    process.exitCode = 1;
    return;
  }

  const origin = await readOrigin();
  const routes = (await findPrerenderedRoutes(browserDir)).filter((route) => !EXCLUDED.has(route));
  const lastmod = new Date().toISOString().slice(0, 10);

  const urls = routes
    .map((route) => {
      const hint = ROUTE_HINTS[route] ?? DEFAULT_HINT;
      return [
        '  <url>',
        `    <loc>${origin}${route === '/' ? '/' : route}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${hint.changefreq}</changefreq>`,
        `    <priority>${hint.priority}</priority>`,
        '  </url>',
      ].join('\n');
    })
    .join('\n');

  const output = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  await writeFile(join(browserDir, 'sitemap.xml'), output, 'utf8');
  // Keep a copy in public/ so `ng serve` and the next build both have it.
  await writeFile(join(projectRoot, 'public', 'sitemap.xml'), output, 'utf8');

  console.log(`[sitemap] Wrote ${routes.length} URLs for ${origin}`);
}

main().catch((error) => {
  console.error('[sitemap] Failed:', error);
  process.exitCode = 1;
});
