/**
 * Produces the 404 page for static hosting.
 *
 * Vercel (and Netlify, Cloudflare Pages, S3) serve `404.html` from the output
 * root for any path that does not match a file, with a real 404 status.
 *
 * The source is `index.csr.html` — Angular's client-side shell — rather than the
 * prerendered `index.html`. Using the home page's HTML would hand the browser
 * fully rendered home-page markup and then ask the router to display the
 * not-found page into it, which trips hydration. The shell has no prerendered
 * content, so the app boots and routes cleanly.
 *
 * Usage: node scripts/write-404.mjs [outputDir]
 */

import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const browserDir = process.argv[2] ?? join(projectRoot, 'dist', 'image-tools', 'browser');

async function main() {
  const shell = join(browserDir, 'index.csr.html');
  const target = join(browserDir, '404.html');

  if (!existsSync(shell)) {
    console.error(`[404] ${shell} not found. Run "ng build" first.`);
    process.exitCode = 1;
    return;
  }

  await copyFile(shell, target);

  // The shell inherits index.html's metadata, which describes the home page.
  // Correct the title and keep the page out of the index.
  const html = await readFile(target, 'utf8');
  const patched = html
    .replace(/<title>[\s\S]*?<\/title>/, '<title>Page not found — ImageTools</title>')
    .replace(
      /<meta name="description"[^>]*>/,
      '<meta name="description" content="The page you were looking for does not exist. Browse the free image tools instead."><meta name="robots" content="noindex, nofollow">',
    );

  await writeFile(target, patched, 'utf8');
  console.log('[404] Wrote 404.html from the client-side shell');
}

main().catch((error) => {
  console.error('[404] Failed:', error);
  process.exitCode = 1;
});
