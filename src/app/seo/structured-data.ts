import { FaqEntry } from './seo.models';
import { SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN, absoluteUrl } from './site.config';

/** Organisation + site search metadata, emitted on every page. */
export function websiteSchema(): Record<string, unknown> {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_ORIGIN}/#website`,
    name: SITE_NAME,
    url: SITE_ORIGIN,
    description: SITE_DESCRIPTION,
    inLanguage: 'en',
    publisher: { '@id': `${SITE_ORIGIN}/#organization` },
  };
}

export function organizationSchema(): Record<string, unknown> {
  return {
    '@type': 'Organization',
    '@id': `${SITE_ORIGIN}/#organization`,
    name: SITE_NAME,
    url: SITE_ORIGIN,
    logo: absoluteUrl('/icon-512.svg'),
  };
}

/** Describes a tool page as a free, browser-based web application. */
export function softwareApplicationSchema(options: {
  name: string;
  description: string;
  path: string;
  features: readonly string[];
}): Record<string, unknown> {
  return {
    '@type': 'WebApplication',
    name: options.name,
    url: absoluteUrl(options.path),
    description: options.description,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Any browser',
    browserRequirements: 'Requires JavaScript and HTML5 Canvas support.',
    featureList: [...options.features],
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    permissions: 'No account, upload or special permission required.',
  };
}

export function faqSchema(entries: readonly FaqEntry[]): Record<string, unknown> {
  return {
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: entry.answer,
      },
    })),
  };
}

export function breadcrumbSchema(
  trail: readonly { name: string; path: string }[],
): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/** Step-by-step instructions, used on the conversion landing pages. */
export function howToSchema(options: {
  name: string;
  description: string;
  steps: readonly { name: string; text: string }[];
}): Record<string, unknown> {
  return {
    '@type': 'HowTo',
    name: options.name,
    description: options.description,
    totalTime: 'PT1M',
    supply: [],
    tool: [],
    step: options.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

export function itemListSchema(
  name: string,
  items: readonly { name: string; path: string; description: string }[],
): Record<string, unknown> {
  return {
    '@type': 'ItemList',
    name,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      description: item.description,
      url: absoluteUrl(item.path),
    })),
  };
}
