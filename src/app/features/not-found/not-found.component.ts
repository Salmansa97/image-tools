import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TOOLS } from '../../core/models/tools.catalog';
import { SeoService } from '../../core/services/seo.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  template: `
    <div
      class="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8"
    >
      <p
        class="font-mono text-7xl font-extrabold text-transparent sm:text-8xl"
        style="background: linear-gradient(135deg, var(--color-brand-600), var(--color-accent-600)); -webkit-background-clip: text; background-clip: text;"
      >
        404
      </p>

      <h1 class="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
        We couldn't find that page
      </h1>

      <p class="mt-4 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
        The link may be out of date, or the address may have a typo in it. All four image tools are
        still right here.
      </p>

      <div class="mt-10 grid w-full gap-3 sm:grid-cols-2">
        @for (tool of tools; track tool.id) {
          <a
            [routerLink]="tool.path"
            class="group flex items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-soft dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500/40"
          >
            <span
              class="flex size-10 shrink-0 items-center justify-center rounded-xl text-white transition-transform group-hover:scale-110"
              [class]="tool.accent"
            >
              <app-icon [name]="tool.icon" [size]="20" />
            </span>
            <span class="min-w-0">
              <span class="block text-sm font-bold">{{ tool.name }}</span>
              <span class="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                {{ tool.tagline }}
              </span>
            </span>
          </a>
        }
      </div>

      <a
        routerLink="/"
        class="mt-10 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-6 py-3 text-sm font-bold text-white shadow-soft transition-all hover:shadow-lift hover:brightness-110"
      >
        <app-icon name="arrow-right" [size]="17" />
        Back to the home page
      </a>
    </div>
  `,
})
export class NotFoundComponent {
  private readonly seo = inject(SeoService);

  protected readonly tools = TOOLS;

  constructor() {
    this.seo.apply({
      title: 'Page not found — ImageTools',
      description:
        'The page you were looking for does not exist. Browse the free image tools instead.',
      path: '/404',
      noIndex: true,
    });
  }
}
