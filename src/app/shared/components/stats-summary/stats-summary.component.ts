import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { formatBytes, savingsPercent } from '../../../core/utilities/file.utils';
import { IconComponent } from '../icon/icon.component';

/**
 * Headline figures for a finished batch:
 *
 *     Original Size: 2.5 MB
 *     Compressed Size: 750 KB
 *     Saved: 70%
 */
@Component({
  selector: 'app-stats-summary',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div
      class="grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-3 dark:border-slate-800 dark:bg-slate-800"
      aria-live="polite"
    >
      <div class="bg-white p-5 dark:bg-slate-900">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {{ originalLabel() }}
        </p>
        <p class="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">{{ originalText() }}</p>
      </div>

      <div class="bg-white p-5 dark:bg-slate-900">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {{ processedLabel() }}
        </p>
        <p class="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">
          {{ processedText() }}
        </p>
      </div>

      <div [class]="savedPanelClass()">
        <p class="text-xs font-semibold uppercase tracking-wide opacity-80">{{ savedLabel() }}</p>
        <p class="mt-1.5 flex items-center gap-2 text-2xl font-bold">
          <app-icon [name]="saved() > 0 ? 'check' : 'info'" [size]="20" [strokeWidth]="2.2" />
          {{ savedText() }}
        </p>
      </div>
    </div>
  `,
})
export class StatsSummaryComponent {
  readonly originalSize = input.required<number>();
  readonly processedSize = input.required<number>();
  readonly originalLabel = input('Original Size');
  readonly processedLabel = input('Compressed Size');
  readonly savedLabel = input('Saved');

  protected readonly originalText = computed(() => formatBytes(this.originalSize()));
  protected readonly processedText = computed(() => formatBytes(this.processedSize()));

  protected readonly saved = computed(() =>
    savingsPercent(this.originalSize(), this.processedSize()),
  );

  protected readonly savedText = computed(() => {
    const value = this.saved();
    if (value > 0) {
      return `${value}%`;
    }
    if (value === 0) {
      return 'No change';
    }
    return `${Math.abs(value)}% larger`;
  });

  protected readonly savedPanelClass = computed(() => {
    const base = 'p-5';
    return this.saved() > 0
      ? `${base} bg-gradient-to-br from-emerald-500 to-emerald-600 text-white`
      : `${base} bg-gradient-to-br from-amber-500 to-amber-600 text-white`;
  });
}
