import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { PageSeo } from '../../seo/seo.models';
import { organizationSchema, websiteSchema } from '../../seo/structured-data';
import { SITE_LOCALE, SITE_NAME, SITE_OG_IMAGE, absoluteUrl } from '../../seo/site.config';

/** Marks the elements this service owns, so route changes can clean up after themselves. */
const MANAGED_ATTRIBUTE = 'data-seo-managed';

/**
 * Applies per-route metadata: title, description, canonical URL, Open Graph,
 * Twitter cards and JSON-LD.
 *
 * Everything here runs during prerendering too, so the HTML a crawler receives
 * already carries the right tags without executing any JavaScript.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  apply(page: PageSeo): void {
    const url = absoluteUrl(page.path);
    const image = absoluteUrl(page.image ?? SITE_OG_IMAGE);

    this.title.setTitle(page.title);

    this.setName('description', page.description);
    this.setName(
      'robots',
      page.noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    );

    if (page.keywords?.length) {
      this.setName('keywords', page.keywords.join(', '));
    } else {
      this.meta.removeTag("name='keywords'");
    }

    this.setProperty('og:title', page.title);
    this.setProperty('og:description', page.description);
    this.setProperty('og:url', url);
    this.setProperty('og:type', page.ogType ?? 'website');
    this.setProperty('og:site_name', SITE_NAME);
    this.setProperty('og:locale', SITE_LOCALE);
    this.setProperty('og:image', image);
    this.setProperty('og:image:alt', `${page.title} — ${SITE_NAME}`);

    this.setName('twitter:card', 'summary_large_image');
    this.setName('twitter:title', page.title);
    this.setName('twitter:description', page.description);
    this.setName('twitter:image', image);

    this.setCanonical(url);
    this.setStructuredData([websiteSchema(), organizationSchema(), ...(page.structuredData ?? [])]);
  }

  private setName(name: string, content: string): void {
    this.meta.updateTag({ name, content });
  }

  private setProperty(property: string, content: string): void {
    this.meta.updateTag({ property, content }, `property='${property}'`);
  }

  private setCanonical(url: string): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private setStructuredData(graph: readonly Record<string, unknown>[]): void {
    const head = this.document.head;

    for (const stale of Array.from(head.querySelectorAll(`script[${MANAGED_ATTRIBUTE}]`))) {
      stale.remove();
    }

    if (graph.length === 0) {
      return;
    }

    const script = this.document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute(MANAGED_ATTRIBUTE, 'true');
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
    head.appendChild(script);
  }
}
