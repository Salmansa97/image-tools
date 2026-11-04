import { IconName } from '../shared/components/icon/icon.component';
import { Breadcrumb } from '../shared/components/page-hero/page-hero.component';

/** Everything a route needs in order to describe itself to a crawler. */
export interface PageSeo {
  /** Used verbatim as `<title>`. */
  readonly title: string;
  readonly description: string;
  /** Root-relative path, e.g. `/compress-image`. */
  readonly path: string;
  readonly keywords?: readonly string[];
  /** `article` for editorial pages, `website` otherwise. */
  readonly ogType?: 'website' | 'article';
  readonly image?: string;
  /** JSON-LD graph entries appended to the page. */
  readonly structuredData?: readonly Record<string, unknown>[];
  /** Set for pages that should stay out of the index. */
  readonly noIndex?: boolean;
}

export interface FaqEntry {
  readonly question: string;
  readonly answer: string;
}

export interface HowToStepContent {
  readonly title: string;
  readonly body: string;
}

export interface BenefitContent {
  readonly icon: IconName;
  readonly title: string;
  readonly body: string;
}

export interface ProseSection {
  readonly title: string;
  readonly paragraphs: readonly string[];
}

/**
 * The editorial content for a tool page.
 *
 * Keeping copy beside its route — rather than inline in the template — means each
 * landing page can say something genuinely different while sharing one layout,
 * which is what keeps these pages out of duplicate-content territory.
 */
export interface ToolPageContent {
  readonly seoTitle: string;
  readonly seoDescription: string;
  readonly path: string;
  readonly keywords: readonly string[];
  readonly breadcrumbs: readonly Breadcrumb[];
  readonly heading: string;
  readonly lead: string;
  readonly eyebrow?: string | null;
  readonly howItWorksTitle: string;
  readonly steps: readonly HowToStepContent[];
  readonly benefitsTitle: string;
  readonly benefits: readonly BenefitContent[];
  readonly faqs: readonly FaqEntry[];
  readonly prose?: readonly ProseSection[];
  /** `id` from the tools catalogue, used to exclude self-links. */
  readonly toolId: string;
  readonly features: readonly string[];
}
