import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { IconComponent } from '../icon/icon.component';

/** Overall batch progress with a live region and a cancel action. */
@Component({
  selector: 'app-processing-progress',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div
      class="rounded-2xl border border-brand-200 bg-brand-50/70 p-4 sm:p-5 dark:border-brand-500/25 dark:bg-brand-500/10"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <app-icon
            name="spinner"
            [size]="18"
            svgClass="animate-spin"
            class="text-brand-600 dark:text-brand-400"
          />
          <p class="text-sm font-semibold text-brand-900 dark:text-brand-100">{{ title() }}</p>
        </div>

        @if (cancellable()) {
          <button
            type="button"
            (click)="cancelled.emit()"
            class="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 px-3 py-1.5 text-xs font-semibold text-brand-800 transition-colors hover:bg-white dark:border-brand-500/40 dark:text-brand-200 dark:hover:bg-slate-900"
          >
            <app-icon name="close" [size]="14" />
            Cancel
          </button>
        }
      </div>

      <div
        class="mt-3 h-2 w-full overflow-hidden rounded-full bg-brand-200/70 dark:bg-brand-500/20"
        role="progressbar"
        aria-label="Overall processing progress"
        [attr.aria-valuenow]="percent()"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          class="h-full rounded-full bg-gradient-to-r from-brand-600 to-accent-500 transition-[width] duration-300 ease-out"
          [style.width.%]="percent()"
        ></div>
      </div>

      <p class="mt-2.5 text-xs text-brand-800/80 dark:text-brand-200/80" aria-live="polite">
        {{ status() }}
      </p>
    </div>
  `,
})
export class ProcessingProgressComponent {
  readonly percent = input.required<number>();
  readonly completed = input(0);
  readonly total = input(0);
  readonly failed = input(0);
  readonly title = input('Processing your images…');
  readonly cancellable = input(true);

  readonly cancelled = output<void>();

  protected readonly status = computed(() => {
    const parts = [`${this.completed()} of ${this.total()} finished`];
    if (this.failed() > 0) {
      parts.push(`${this.failed()} failed`);
    }
    parts.push('everything stays on your device');
    return `${parts.join(' • ')}.`;
  });
}
