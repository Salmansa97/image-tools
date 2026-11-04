import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TOOLS } from '../../core/models/tools.catalog';
import { SeoService } from '../../core/services/seo.service';
import { breadcrumbSchema } from '../../seo/structured-data';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero.component';
import { RelatedToolsComponent } from '../../shared/components/related-tools/related-tools.component';

@Component({
  selector: 'app-about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeroComponent, RelatedToolsComponent, IconComponent],
  templateUrl: './about.component.html',
})
export class AboutComponent {
  private readonly seo = inject(SeoService);

  protected readonly tools = TOOLS;

  protected readonly techStack = [
    { title: 'HTML5 Canvas', body: 'Decoding, scaling, rotating and re-encoding every image.' },
    {
      title: 'Web Workers',
      body: 'Background threads so bulk operations never block the interface.',
    },
    {
      title: 'OffscreenCanvas',
      body: 'Lets those workers draw without touching the DOM, with a main-thread fallback for older browsers.',
    },
    {
      title: 'Blob and Object URLs',
      body: 'Holding results in memory and handing them to you as downloads, with every URL released afterwards.',
    },
    { title: 'JSZip', body: 'Assembling batch downloads into an archive — also on your device.' },
  ] as const;

  protected readonly facts = [
    { term: 'Images uploaded', value: 'None, ever' },
    { term: 'Account required', value: 'No' },
    { term: 'File size limit', value: '50 MB per image' },
    { term: 'Formats', value: 'JPG, PNG, WebP' },
    { term: 'Batch processing', value: 'Yes, with ZIP download' },
    { term: 'Cost', value: 'Free, with no paid tier' },
  ] as const;

  protected readonly breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
  ] as const;

  constructor() {
    this.seo.apply({
      title: 'About ImageTools — Private, Browser-Based Image Processing',
      description:
        'ImageTools is a free set of image tools that run entirely in your browser. Learn how client-side processing works, why it is more private, and what the technology behind it is.',
      path: '/about',
      ogType: 'article',
      keywords: ['about imagetools', 'client-side image processing', 'private image tools'],
      structuredData: [
        breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'About', path: '/about' },
        ]),
      ],
    });
  }
}
