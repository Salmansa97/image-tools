import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { FaqEntry } from '../../../seo/seo.models';

/**
 * FAQ list built on `<details>`/`<summary>`.
 *
 * Native disclosure elements are keyboard accessible and, crucially for SEO, their
 * answers are present in the prerendered HTML rather than hidden behind a click
 * handler a crawler will not run.
 */
@Component({
  selector: 'app-faq-accordion',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900"
    >
      @for (entry of entries(); track entry.question) {
        <details class="group" [open]="$first && openFirst()">
          <summary
            class="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-slate-900 transition-colors hover:bg-slate-50 sm:px-6 dark:text-white dark:hover:bg-slate-800/60"
          >
            <h3 class="text-base">{{ entry.question }}</h3>
            <svg
              class="size-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </summary>
          <p class="px-5 pb-5 text-sm leading-relaxed text-slate-600 sm:px-6 dark:text-slate-400">
            {{ entry.answer }}
          </p>
        </details>
      }
    </div>
  `,
})
export class FaqAccordionComponent {
  readonly entries = input.required<readonly FaqEntry[]>();
  readonly openFirst = input(true);
}
