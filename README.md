# ImageTools

A production-ready online image toolkit — **15 tools** for compressing, editing, generating and inspecting images — built with **Angular 21**.

Every image is decoded, transformed and re-encoded **inside the visitor's browser**. There is no backend, no API, and no upload: the site is a set of static files, and the processing uses the Canvas API running in Web Workers on the user's own device.

---

## Quick start

```bash
npm install
npm start          # dev server on http://localhost:4200
npm run build      # production build + sitemap, into dist/image-tools
npm test           # unit tests (Vitest)
npm run preview    # serve the production build locally
```

> **Note on `npm install`:** the repo contains an `.npmrc` with `legacy-peer-deps=true`. npm 10's peer-dependency resolver crashes (`Cannot read properties of null (reading 'edgesOut')`) on Vitest 4's optional peer graph; this flag sidesteps it. Remove it once you are on npm 11.

---

## The tools

| Route | Tool | What it does |
| --- | --- | --- |
| `/` | Home | Drag-and-drop hand-off into any tool |
| `/tools` | Tools index | All 14, grouped by category |
| **Optimise & convert** | | |
| `/compress-image` | Compressor | Bulk, quality slider, resolution cap, before/after |
| `/convert-image` | Converter | Bulk JPG ⇄ PNG ⇄ WebP |
| `/image-to-base64` | Base64 | Data URI / CSS / HTML / JSON, and decode back |
| **Edit & transform** | | |
| `/resize-image` | Resizer | Exact pixels, ratio lock, % scaling, presets |
| `/crop-image` | Cropper | Interactive box, ratio locks, zoom, rotate, flip |
| `/rotate-image` | Rotator | Quarter turns and free angle, canvas auto-expanded |
| `/flip-image` | Flipper | Horizontal and vertical mirroring |
| `/image-filters` | Filters | Brightness/contrast/saturation/blur, 9 presets, undo-redo |
| `/watermark-image` | Watermark | Text or logo, 9 anchors or tiled, bulk |
| `/remove-background` | Background Remover | Automatic colour-key cut-out, erase/restore brushes, transparent PNG |
| **Generate** | | |
| `/favicon-generator` | Favicon | 10 sizes, multi-res `.ico`, manifest, HTML snippet |
| `/social-media-image-resizer` | Social sizes | 14 current platform sizes in one pass |
| **Inspect & clean** | | |
| `/image-metadata-viewer` | Metadata viewer | Full EXIF read incl. GPS, for JPEG/PNG/WebP |
| `/remove-metadata` | Metadata remover | Strips EXIF/GPS/XMP/ICC in bulk |
| `/image-color-picker` | Colour picker | Pixel sampling + palette extraction |
| | | |
| `/png-to-jpg`, `/jpg-to-png`, `/webp-converter` | | Intent-specific landing pages sharing the converter |
| `/history` | History | Local log of what you processed (`noindex`) |
| `/about`, `/privacy-policy` | | Editorial pages |

All tools accept JPG, PNG and WebP up to 50 MB per file. The batch tools (compressor, converter, watermark, metadata remover) show per-file progress, can be cancelled mid-run, and offer a ZIP download.

---

## Architecture

```
src/app/
  core/
    models/        domain types + the tool catalogue
    services/      one service per tool, plus the worker pool, sessions,
                   ZIP, downloads, SEO, theme and local history
    utilities/     the image pipeline, colour quantiser, EXIF parser,
                   content sniffing, colour maths, undo stack, concurrency
    workers/       the dedicated image worker
  shared/
    components/    FileUploader, ImageCard, OptionsPanel, OutputFormatField,
                   SingleImageResult, BeforeAfterComparison, CopyButton, …
    directives/    DragDrop
    pipes/         fileSize, formatLabel
  features/        one folder per tool, each with its own SEO content file
  layout/          header, footer
  seo/             site config, structured data, per-page metadata
```

Every route is lazy-loaded and every component is standalone with `OnPush` change detection. State is held in Angular signals; the app runs **zoneless**.

### Two session services carry the shared plumbing

Fourteen tools would otherwise repeat the same load/run/cancel/error code fourteen times:

- **`SingleImageSession`** — load a file, know when it has been measured, run an operation, surface errors, start over. Used by the nine single-image tools.
- **`BatchSession`** — mark queued, run with pool concurrency, settle cancelled items, build a ZIP. Used by the four batch tools.

### The image pipeline

`core/utilities/image-processor.ts` is isomorphic — no Angular, no DOM assumptions — so it runs unchanged on the main thread or inside a worker:

- **Canvas**: prefers `OffscreenCanvas`, falls back to a DOM canvas.
- **Decoding**: prefers `createImageBitmap`, falls back to `HTMLImageElement`.
- **Downscaling**: repeated halving rather than one large `drawImage`, which avoids the aliasing a single-step downscale produces.
- **Encoding**: verifies the browser actually produced the requested MIME type instead of silently substituting another.
- **Operations**: `compress`, `resize`, `convert`, `crop`, `transform` (free rotation + flips, canvas expanded to the rotated bounding box), `filter`, `watermark`, `fit` (cover/contain/stretch).

`ImageWorkerService` runs a pool of `min(4, cores - 1)` workers with a FIFO queue and `AbortSignal` support. A worker cannot be interrupted mid-encode, so cancelling a running task terminates its worker and the pool grows a replacement. Where workers or `OffscreenCanvas` are unavailable, the same pipeline runs on the main thread.

### Real PNG compression

Canvas encoders ignore the quality argument for PNG, because PNG is lossless. Rather than ship a slider that does nothing, `core/utilities/quantize.ts` implements median-cut colour quantisation over a 5-bit histogram. Reducing the palette gives DEFLATE far more repetition to exploit — in testing a 1.8 MB PNG drops to 541 KB (−71%). The same code powers palette extraction in the colour picker.

### Background removal

`core/utilities/background-removal.ts` is a region-growing colour key, not a
machine-learning matte — so there is no 40 MB model to download and nothing is
uploaded. A palette is sampled from the image border (several colours, not one,
so gradients and two-tone backdrops key cleanly), the fill grows inwards from
the frame edge while colours match that palette, and the hard mask is then
feathered into a soft alpha and de-spilled.

It is deliberately honest about its limits: it is excellent on product shots,
logos, scans, screenshots and studio portraits, and rough on a subject against a
cluttered scene. The erase and restore brushes exist so those images are still
finishable by hand. The preview recomputes on the main thread at a bounded
resolution so sliders feel instant; the export re-runs the identical algorithm
at full resolution inside the worker.

### Metadata

`core/utilities/metadata.ts` parses containers directly: JPEG APP segments with a full EXIF/TIFF IFD walk (including the GPS IFD), PNG chunks, and WebP RIFF chunks. No library, and nothing is uploaded to be inspected — which matters, because uploading a photo to check whether it leaks your location rather defeats the purpose.

Removal is a decode-and-re-encode rather than surgery on the container: rebuilding the file from pixels alone means there is physically nowhere for EXIF, XMP, IPTC or maker notes to survive.

### Memory

Object URLs are the easiest way to leak hundreds of megabytes in a tab. `ImageBatchStore` is provided per feature component and owns the full lifecycle: URLs are revoked on replacement, removal, reset and teardown. The favicon, social and Base64 tools own their own generated URLs and revoke them the same way. Confirmation timers are cleared on destroy.

---

## Security and validation

- **Content sniffing, not extensions.** `core/utilities/sniff.ts` reads magic bytes. A JPEG renamed `.png` is identified correctly; a HEIC is named as a HEIC and refused with an explanation rather than failing opaquely inside the decoder.
- **Decompression-bomb guard.** A small PNG can decode to 60,000 × 60,000 pixels — over 14 GB of RGBA. Images above 120 megapixels are refused with a message instead of crashing the tab.
- **Canvas limits.** Output is clamped to 16,384 px per edge and 64 megapixels, scaling down proportionally rather than producing a blank canvas.
- **Size and emptiness checks**, with per-file reasons surfaced in the UI.
- **No network egress for image data**, verified in the test suite by asserting zero POST/PUT/PATCH requests and by processing an image with the network disconnected.

---

## SEO

The site is **statically prerendered** (`outputMode: "static"`), so crawlers receive complete HTML with no JavaScript execution required — and there is still no server to run.

Each route supplies a `ToolPageContent` object holding both its visible copy and its metadata, so what a visitor reads and what a crawler receives cannot drift apart. `SeoService` applies the title, description, canonical URL, Open Graph and Twitter tags, and a JSON-LD `@graph` per page (`WebApplication`, `HowTo`, `FAQPage`, `BreadcrumbList`, plus site-wide `WebSite` and `Organization`).

All 22 routes have unique titles and descriptions, verified in the audit suite. Internal linking is category-aware: each tool page links to its closest siblings rather than to all thirteen others.

`sitemap.xml` is generated after each build from the pages that were actually prerendered (`scripts/generate-sitemap.mjs`), so it cannot fall out of sync with the routes; `/history` is excluded and marked `noindex`.

**Deploying to your own domain:** change `SITE_ORIGIN` in `src/app/seo/site.config.ts` and the `Sitemap:` line in `public/robots.txt`, then rebuild.

---

## Visual design and motion

The interface is deliberately lively without becoming noisy:

- **Aurora fields** — slow-drifting blurred colour behind the hero and section headers, with a fine noise overlay so the large gradients do not band.
- **A live hero demo** — the sample is drawn on a canvas at runtime (so it costs no download) and then put through the *real* compression pipeline. The sizes shown are an actual measurement from the visitor's own browser, not a mock-up.
- **Scroll reveal** (`appReveal`) — content fades up as it enters the viewport, staggered within a group. The class is applied by the directive, so prerendered HTML stays visible without JavaScript.
- **Count-up stats** — render their final value server-side and animate only in the browser.
- **Tactile cards** — gradient hairline on hover, an ambient wash in each tool's own colour, and the icon lifting and tilting.
- **Clipboard paste** — an image copied anywhere can be pasted straight onto any tool page.

Every one of these is disabled under `prefers-reduced-motion`: drifting stops, reveals show immediately, and the count-up renders its final figure.

## Accessibility

- One `<h1>` per page, semantic landmarks, a skip link, and no heading-level skips (verified across all routes).
- The upload zone is a keyboard-operable button; the crop box and each of its eight handles are focusable and respond to arrow keys; the colour sampler can be driven by keyboard.
- The before/after divider is a real `role="slider"` with arrow-key support.
- Format, ratio and fit choosers are radio groups, not rows of buttons.
- Progress uses `role="progressbar"` with live regions; `prefers-reduced-motion` is honoured.
- Every interactive control meets the 24 px minimum target size; inline prose links are exempt by specification.

## Browser support

Current Chrome, Edge, Firefox and Safari. WebP encoding is detected at runtime and reported rather than silently substituted. Formats browsers cannot encode (HEIC, AVIF, TIFF, RAW) are out of scope by design and are named explicitly on rejection.

---

## Testing

- **`npm test`** — 108 unit tests over the pure logic: file validation and naming, byte formatting, content sniffing, colour quantisation, colour conversion and palette extraction, the undo stack, crop/resize geometry, and the EXIF/PNG/WebP metadata parser (verified against hand-built containers with known values).
- **End-to-end**, in headless Chrome against the production build: 69 functional checks covering the tool suite, 13 dedicated background-remover checks, plus 23 security and edge-case checks. These upload real files, run the tools, download the results and inspect the resulting **bytes** — confirming format, dimensions, transparency handling, that EXIF is genuinely gone after stripping, and that nothing is ever uploaded.
- **Audit sweep** — 23 routes × 3 viewports checking layout overflow, heading structure, SEO tags, duplicate titles, alt text, tap-target sizes and console errors.

## Deployment

`npm run build` produces `dist/image-tools/browser` — plain static files, ~102 kB
initial transfer. Every route is prerendered to its own `index.html`, so there is
no server to run and no SPA catch-all rewrite needed: a real route is a real
file, and anything else is genuinely a 404.

The build also emits:

- `sitemap.xml` — generated from the pages that were actually prerendered
- `404.html` — Angular's client-side shell, retitled and marked `noindex`, which
  static hosts serve with a real 404 status

### Before the first deploy

**Set your domain.** `SITE_ORIGIN` in `src/app/seo/site.config.ts` is baked into
canonical URLs, Open Graph tags and the sitemap at build time. Leave it pointing
at the wrong host and every page will tell Google it is a duplicate of a site you
do not own. Change it there and in the `Sitemap:` line of `public/robots.txt`,
then rebuild.

### Vercel

`vercel.json` is committed and sets the build command, output directory, clean
URLs and cache headers, so no dashboard configuration is required.

```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production
```

Or connect the repository in the Vercel dashboard and push — the settings in
`vercel.json` are picked up automatically.

Two things that must be committed for the Vercel build to succeed:

- **`.npmrc`** — carries `legacy-peer-deps=true`. Without it, npm 10's resolver
  crashes on Vitest 4's peer graph and the install fails before the build starts.
- **`package-lock.json`** — Vercel runs `npm ci`, which requires it.

### Other static hosts

The same output works unchanged on Netlify, Cloudflare Pages, GitHub Pages, S3 +
CloudFront or nginx. The only requirements are to serve `404.html` for unmatched
paths and, ideally, to redirect `/path/` to `/path` so URLs match the canonical
tags.
