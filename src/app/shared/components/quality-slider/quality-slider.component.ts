import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

/**
 * Quality control shared by the compressor, resizer and converter.
 *
 * Uses `model()` so it works with two-way binding in template-driven and
 * signal-based parents alike, while remaining a plain accessible range input.
 */
@Component({
  selector: 'app-quality-slider',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full">
      <div class="flex items-baseline justify-between gap-3">
        <label [attr.for]="inputId()" class="text-sm font-semibold text-slate-900 dark:text-white">
          {{ label() }}
        </label>
        <span
          class="rounded-lg bg-brand-50 px-2.5 py-1 font-mono text-sm font-semibold text-brand-700 tabular-nums dark:bg-brand-500/15 dark:text-brand-300"
        >
          {{ value() }}%
        </span>
      </div>

      <input
        [id]="inputId()"
        type="range"
        [min]="min()"
        [max]="max()"
        step="1"
        [value]="value()"
        [disabled]="disabled()"
        (input)="onInput($event)"
        [attr.aria-describedby]="inputId() + '-hint'"
        class="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-700 dark:accent-brand-400"
        [style.backgroundImage]="trackBackground()"
      />

      <p [id]="inputId() + '-hint'" class="mt-2 text-xs text-slate-500 dark:text-slate-400">
        {{ hint() }}
      </p>
    </div>
  `,
})
export class QualitySliderComponent {
  readonly value = model.required<number>();
  readonly label = input('Compression quality');
  readonly min = input(10);
  readonly max = input(100);
  readonly disabled = input(false);
  readonly inputId = input('quality-slider');
  readonly hintOverride = input<string | null>(null);

  protected readonly hint = computed(() => {
    const override = this.hintOverride();
    if (override) {
      return override;
    }
    const value = this.value();
    if (value >= 90) {
      return 'Near-original quality. Best for printing and archiving.';
    }
    if (value >= 70) {
      return 'Recommended. Visually identical for most photos, much smaller files.';
    }
    if (value >= 40) {
      return 'Noticeably smaller. Fine for thumbnails and fast-loading pages.';
    }
    return 'Aggressive. Expect visible artefacts in detailed areas.';
  });

  /** Fills the portion of the track to the left of the thumb with the brand colour. */
  protected readonly trackBackground = computed(() => {
    const min = this.min();
    const max = this.max();
    const percent = max === min ? 0 : ((this.value() - min) / (max - min)) * 100;
    return `linear-gradient(to right, var(--color-brand-600) 0%, var(--color-brand-500) ${percent}%, transparent ${percent}%)`;
  });

  protected onInput(event: Event): void {
    this.value.set(Number((event.target as HTMLInputElement).value));
  }
}
