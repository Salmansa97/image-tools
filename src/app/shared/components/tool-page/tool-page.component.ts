import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ToolPageContent } from '../../../seo/seo.models';
import { RevealDirective } from '../../directives/reveal.directive';
import { AuroraComponent } from '../aurora/aurora.component';
import { FaqAccordionComponent } from '../faq-accordion/faq-accordion.component';
import { IconComponent } from '../icon/icon.component';
import { PageHeroComponent } from '../page-hero/page-hero.component';
import { RelatedToolsComponent } from '../related-tools/related-tools.component';

/**
 * Shared chrome for every tool page: hero, the tool itself, then the editorial
 * sections that make the page worth indexing.
 *
 * The tool is projected in, so all four tools share one layout and one heading
 * hierarchy while keeping their own interface and their own copy.
 */
@Component({
  selector: 'app-tool-page',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    PageHeroComponent,
    FaqAccordionComponent,
    RelatedToolsComponent,
    IconComponent,
    AuroraComponent,
    RevealDirective,
  ],
  template: `
    <div class="relative isolate">
      <app-aurora />

      <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <app-page-hero
          [heading]="content().heading"
          [lead]="content().lead"
          [eyebrow]="eyebrow()"
          [breadcrumbs]="content().breadcrumbs"
        />

        <section class="mt-10" aria-label="Tool">
          <ng-content />
        </section>

        <section class="mt-20" aria-labelledby="how-it-works-heading">
          <h2 appReveal id="how-it-works-heading" class="text-2xl font-bold sm:text-3xl">
            {{ content().howItWorksTitle }}
          </h2>

          <ol class="relative mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <span
              class="pointer-events-none absolute top-10 right-10 left-10 hidden h-px bg-gradient-to-r from-brand-300 via-accent-300 to-hot-400 opacity-50 lg:block dark:from-brand-600 dark:via-accent-600 dark:to-hot-600"
              aria-hidden="true"
            ></span>

            @for (step of content().steps; track step.title) {
              <li
                [appReveal]="$index * 90"
                class="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift dark:border-slate-800 dark:bg-slate-900"
              >
                <span
                  class="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-600 text-sm font-bold text-white shadow-lift transition-transform duration-300 group-hover:scale-110"
                >
                  {{ $index + 1 }}
                </span>
                <h3 class="mt-4 text-base font-bold">{{ step.title }}</h3>
                <p class="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {{ step.body }}
                </p>
              </li>
            }
          </ol>
        </section>

        <section class="mt-20" aria-labelledby="benefits-heading">
          <h2 appReveal id="benefits-heading" class="text-2xl font-bold sm:text-3xl">
            {{ content().benefitsTitle }}
          </h2>

          <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            @for (benefit of content().benefits; track benefit.title) {
              <article
                [appReveal]="$index * 70"
                class="group glow-ring relative rounded-2xl border border-slate-200 bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift dark:border-slate-800 dark:bg-slate-900"
              >
                <span
                  class="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-accent-50 text-brand-700 transition-transform duration-300 group-hover:scale-110 dark:from-brand-500/15 dark:to-accent-500/15 dark:text-brand-300"
                >
                  <app-icon [name]="benefit.icon" [size]="22" />
                </span>
                <h3 class="mt-4 text-base font-bold">{{ benefit.title }}</h3>
                <p class="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {{ benefit.body }}
                </p>
              </article>
            }
          </div>
        </section>

        @if (content().prose; as sections) {
          @for (section of sections; track section.title) {
            <section appReveal class="mt-20 max-w-3xl">
              <h2 class="text-2xl font-bold sm:text-3xl">{{ section.title }}</h2>
              @for (paragraph of section.paragraphs; track paragraph) {
                <p class="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
                  {{ paragraph }}
                </p>
              }
            </section>
          }
        }

        <section class="mt-20" id="faq" aria-labelledby="faq-heading">
          <h2 appReveal id="faq-heading" class="text-2xl font-bold sm:text-3xl">
            Frequently asked questions
          </h2>
          <div appReveal class="mt-8 max-w-3xl">
            <app-faq-accordion [entries]="content().faqs" />
          </div>
        </section>

        <div appReveal class="mt-20">
          <app-related-tools [exclude]="content().toolId" />
        </div>

        <section
          appReveal
          class="relative isolate mt-20 overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-600 via-brand-700 to-accent-700 px-6 py-14 text-center sm:px-12 sm:py-16"
        >
          <div class="grain pointer-events-none absolute inset-0"></div>
          <span
            class="animate-drift pointer-events-none absolute -top-24 -left-16 size-72 rounded-full bg-white/15 blur-3xl"
            aria-hidden="true"
          ></span>
          <span
            class="animate-drift-slow pointer-events-none absolute -right-16 -bottom-24 size-80 rounded-full bg-hot-500/25 blur-3xl"
            aria-hidden="true"
          ></span>

          <div class="relative">
            <h2 class="text-2xl font-extrabold text-white sm:text-4xl">
              Your images never leave your device
            </h2>
            <p class="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-brand-100 sm:text-base">
              Everything here runs on your own hardware using the browser's built-in image engine.
              Nothing is uploaded, nothing is stored, and nothing is ever shared.
            </p>
            <a
              routerLink="/tools"
              class="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-700 shadow-lift transition-all hover:-translate-y-0.5 hover:scale-[1.03]"
            >
              See all image tools
              <app-icon name="arrow-right" [size]="17" />
            </a>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class ToolPageComponent {
  readonly content = input.required<ToolPageContent>();

  /**
   * Tool pages show the privacy badge unless a page opts out.
   *
   * `undefined` means "nothing specified, use the default"; an explicit `null`
   * means "hide it". Collapsing both to `null` would have silently suppressed
   * the badge on every page that simply did not mention it.
   */
  protected readonly eyebrow = computed(() => {
    const value = this.content().eyebrow;
    return value === undefined ? '100% private — processed on your device' : value;
  });
}
