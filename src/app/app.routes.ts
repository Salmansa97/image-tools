import { Routes } from '@angular/router';

/**
 * Every route is lazy-loaded, so a visitor who lands on `/png-to-jpg` downloads
 * that page and nothing else. Paths double as the site's SEO slugs, which is why
 * they read `/compress-image` rather than `/compressor`.
 *
 * The four conversion routes share one component and are distinguished by the
 * `presetKey` in their route data, bound to the component through
 * `withComponentInputBinding()`.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'compress-image',
    loadComponent: () =>
      import('./features/compressor/compressor.component').then((m) => m.CompressorComponent),
  },
  {
    path: 'resize-image',
    loadComponent: () =>
      import('./features/resizer/resizer.component').then((m) => m.ResizerComponent),
  },
  {
    path: 'crop-image',
    loadComponent: () =>
      import('./features/cropper/cropper.component').then((m) => m.CropperComponent),
  },
  {
    path: 'convert-image',
    data: { presetKey: 'general' },
    loadComponent: () =>
      import('./features/converter/converter.component').then((m) => m.ConverterComponent),
  },
  {
    path: 'png-to-jpg',
    data: { presetKey: 'pngToJpg' },
    loadComponent: () =>
      import('./features/converter/converter.component').then((m) => m.ConverterComponent),
  },
  {
    path: 'jpg-to-png',
    data: { presetKey: 'jpgToPng' },
    loadComponent: () =>
      import('./features/converter/converter.component').then((m) => m.ConverterComponent),
  },
  {
    path: 'webp-converter',
    data: { presetKey: 'webp' },
    loadComponent: () =>
      import('./features/converter/converter.component').then((m) => m.ConverterComponent),
  },
  {
    path: 'rotate-image',
    loadComponent: () =>
      import('./features/rotate/rotate.component').then((m) => m.RotateComponent),
  },
  {
    path: 'flip-image',
    loadComponent: () => import('./features/flip/flip.component').then((m) => m.FlipComponent),
  },
  {
    path: 'image-filters',
    loadComponent: () =>
      import('./features/filters/filters.component').then((m) => m.FiltersComponent),
  },
  {
    path: 'remove-background',
    loadComponent: () =>
      import('./features/background-remover/background-remover.component').then(
        (m) => m.BackgroundRemoverComponent,
      ),
  },
  {
    path: 'watermark-image',
    loadComponent: () =>
      import('./features/watermark/watermark.component').then((m) => m.WatermarkComponent),
  },
  {
    path: 'favicon-generator',
    loadComponent: () =>
      import('./features/favicon/favicon.component').then((m) => m.FaviconComponent),
  },
  {
    path: 'social-media-image-resizer',
    loadComponent: () =>
      import('./features/social/social.component').then((m) => m.SocialComponent),
  },
  {
    path: 'image-metadata-viewer',
    loadComponent: () =>
      import('./features/metadata/metadata.component').then((m) => m.MetadataComponent),
  },
  {
    path: 'remove-metadata',
    loadComponent: () =>
      import('./features/strip-metadata/strip-metadata.component').then(
        (m) => m.StripMetadataComponent,
      ),
  },
  {
    path: 'image-color-picker',
    loadComponent: () =>
      import('./features/colors/colors.component').then((m) => m.ColorsComponent),
  },
  {
    path: 'image-to-base64',
    loadComponent: () =>
      import('./features/base64/base64.component').then((m) => m.Base64Component),
  },
  {
    path: 'tools',
    loadComponent: () =>
      import('./features/tools-index/tools-index.component').then((m) => m.ToolsIndexComponent),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./features/history/history.component').then((m) => m.HistoryComponent),
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/about.component').then((m) => m.AboutComponent),
  },
  {
    path: 'privacy-policy',
    loadComponent: () =>
      import('./features/privacy/privacy.component').then((m) => m.PrivacyComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
