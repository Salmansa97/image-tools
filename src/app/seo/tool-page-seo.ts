import { PageSeo, ToolPageContent } from './seo.models';
import {
  breadcrumbSchema,
  faqSchema,
  howToSchema,
  softwareApplicationSchema,
} from './structured-data';

/**
 * Derives the full SEO payload — including JSON-LD — from a page's editorial
 * content, so the copy a visitor reads and the data a crawler receives can never
 * drift apart.
 */
export function toolPageSeo(content: ToolPageContent): PageSeo {
  return {
    title: content.seoTitle,
    description: content.seoDescription,
    path: content.path,
    keywords: content.keywords,
    structuredData: [
      softwareApplicationSchema({
        name: content.heading,
        description: content.seoDescription,
        path: content.path,
        features: content.features,
      }),
      howToSchema({
        name: content.howItWorksTitle,
        description: content.seoDescription,
        steps: content.steps.map((step) => ({ name: step.title, text: step.body })),
      }),
      faqSchema(content.faqs),
      breadcrumbSchema(
        content.breadcrumbs.map((crumb) => ({ name: crumb.name, path: crumb.path })),
      ),
    ],
  };
}
