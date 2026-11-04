import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconComponent, IconName } from '../icon/icon.component';

export interface ToolDefinition {
  readonly id: string;
  readonly name: string;
  /** Shorter, action-first label used in the main navigation. */
  readonly navLabel: string;
  readonly path: string;
  readonly icon: IconName;
  readonly category: 'optimise' | 'edit' | 'create' | 'inspect';
  /** Promoted into the top navigation; the rest live on the tools index. */
  readonly featured: boolean;
  readonly tagline: string;
  readonly description: string;
  /** Tailwind gradient classes for the icon tile. */
  readonly accent: string;
}

/** Promo card linking to one of the tools. */
@Component({
  selector: 'app-tool-card',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  template: `
    <article
      class="group glow-ring relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow dark:border-slate-800 dark:bg-slate-900"
    >
      <!-- Ambient wash in the tool's own colour, warming on hover -->
      <span
        class="pointer-events-none absolute -top-14 -right-14 size-36 rounded-full opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-50"
        [class]="tool().accent"
        aria-hidden="true"
      ></span>

      <div
        class="relative flex size-12 items-center justify-center rounded-2xl text-white shadow-lift transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
        [class]="tool().accent"
      >
        <app-icon [name]="tool().icon" [size]="24" [strokeWidth]="1.7" />
      </div>

      <h3 class="relative mt-5 text-lg font-bold">
        <a
          [routerLink]="tool().path"
          class="after:absolute after:inset-0 after:content-[''] focus:outline-none"
        >
          {{ tool().name }}
        </a>
      </h3>

      <p
        class="relative mt-0.5 text-xs font-bold tracking-wide text-brand-600 uppercase dark:text-brand-400"
      >
        {{ tool().tagline }}
      </p>

      <p class="relative mt-3 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {{ tool().description }}
      </p>

      <span
        class="relative mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 transition-colors group-hover:text-brand-800 dark:text-brand-400 dark:group-hover:text-brand-300"
      >
        Open Tool
        <app-icon
          name="arrow-right"
          [size]="15"
          svgClass="transition-transform duration-300 group-hover:translate-x-1.5"
        />
      </span>
    </article>
  `,
})
export class ToolCardComponent {
  readonly tool = input.required<ToolDefinition>();
}
