import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconComponent } from '../icon/icon.component';

export interface Breadcrumb {
  readonly name: string;
  readonly path: string;
}

/**
 * Shared page introduction: breadcrumb trail, single `<h1>` and a lead paragraph.
 *
 * Keeping it in one component guarantees every route has exactly one `<h1>` and a
 * consistent heading hierarchy.
 */
@Component({
  selector: 'app-page-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  host: { class: 'block' },
  template: `
    @if (breadcrumbs().length > 0) {
      <nav aria-label="Breadcrumb" class="mb-5">
        <ol class="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          @for (crumb of breadcrumbs(); track crumb.path) {
            <li class="flex items-center gap-1.5">
              @if (!$last) {
                <a
                  [routerLink]="crumb.path"
                  class="-my-1 inline-flex min-h-6 items-center rounded py-1 transition-colors hover:text-brand-700 dark:hover:text-brand-400"
                >
                  {{ crumb.name }}
                </a>
                <app-icon
                  name="chevron-right"
                  [size]="12"
                  class="text-slate-300 dark:text-slate-600"
                />
              } @else {
                <span class="font-medium text-slate-700 dark:text-slate-300" aria-current="page">
                  {{ crumb.name }}
                </span>
              }
            </li>
          }
        </ol>
      </nav>
    }

    @if (eyebrow()) {
      <p
        class="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
      >
        <app-icon name="lock" [size]="13" />
        {{ eyebrow() }}
      </p>
    }

    <h1
      class="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"
    >
      {{ heading() }}
    </h1>

    <p
      class="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-400"
    >
      {{ lead() }}
    </p>

    <ng-content />
  `,
})
export class PageHeroComponent {
  readonly heading = input.required<string>();
  readonly lead = input.required<string>();
  readonly eyebrow = input<string | null>('100% private — processed on your device');
  readonly breadcrumbs = input<readonly Breadcrumb[]>([]);
}
