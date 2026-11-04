import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TOOLS, toolById } from '../../../core/models/tools.catalog';
import { IconComponent } from '../icon/icon.component';

/**
 * Cross-links to the other tools.
 *
 * Besides being useful, this gives every tool page inbound internal links from
 * its siblings, which is what lets crawlers discover and rank the whole set.
 */
@Component({
  selector: 'app-related-tools',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  template: `
    <section [attr.aria-labelledby]="headingId()">
      <h2 [id]="headingId()" class="text-xl font-bold sm:text-2xl">{{ heading() }}</h2>
      <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">{{ subheading() }}</p>

      <ul class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (tool of related(); track tool.id) {
          <li>
            <a
              [routerLink]="tool.path"
              class="group flex h-full items-start gap-3.5 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500/40"
            >
              <span
                class="flex size-9 shrink-0 items-center justify-center rounded-lg text-white"
                [class]="tool.accent"
              >
                <app-icon [name]="tool.icon" [size]="18" />
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-semibold text-slate-900 dark:text-white">
                  {{ tool.name }}
                </span>
                <span
                  class="mt-0.5 block text-xs leading-relaxed text-slate-500 dark:text-slate-400"
                >
                  {{ tool.tagline }}
                </span>
              </span>
            </a>
          </li>
        }
      </ul>
    </section>
  `,
})
export class RelatedToolsComponent {
  /** `id` of the tool to leave out, so a page never links to itself. */
  readonly exclude = input<string | null>(null);
  readonly heading = input('Explore the other tools');
  readonly subheading = input(
    'Every tool runs in your browser — no uploads, no accounts, no watermarks.',
  );
  readonly headingId = input('related-tools-heading');

  /**
   * Prefers siblings from the same category, then fills up with featured tools.
   *
   * With fourteen tools, linking to all of them from every page is noise; six
   * relevant neighbours are more useful to a reader and a better internal-link
   * signal than an undifferentiated list.
   */
  protected readonly related = computed(() => {
    const excludeId = this.exclude();
    const current = excludeId ? toolById(excludeId) : undefined;
    const candidates = TOOLS.filter((tool) => tool.id !== excludeId);

    const sameCategory = current
      ? candidates.filter((tool) => tool.category === current.category)
      : [];
    const others = candidates.filter((tool) => !sameCategory.includes(tool));

    // Featured tools make the best filler: they are the ones most people want next.
    others.sort((a, b) => Number(b.featured) - Number(a.featured));

    return [...sameCategory, ...others].slice(0, this.limit());
  });

  readonly limit = input(6);
}
