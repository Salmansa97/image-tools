import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface SegmentOption {
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
  readonly disabled?: boolean;
}

/**
 * Compact single-choice control used for output formats and aspect ratios.
 *
 * Implemented as a radio group rather than a row of buttons so screen readers
 * announce it as one control with a current selection.
 */
@Component({
  selector: 'app-segmented-control',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset class="w-full">
      <legend class="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
        {{ label() }}
      </legend>

      <div
        class="inline-flex w-full flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800"
        role="radiogroup"
        [attr.aria-label]="label()"
      >
        @for (option of options(); track option.value) {
          <label [class]="optionClass(option)" [attr.title]="option.hint ?? null">
            <input
              type="radio"
              class="sr-only"
              [name]="groupName()"
              [value]="option.value"
              [checked]="value() === option.value"
              [disabled]="option.disabled ?? false"
              (change)="value.set(option.value)"
            />
            {{ option.label }}
          </label>
        }
      </div>
    </fieldset>
  `,
})
export class SegmentedControlComponent {
  readonly value = model.required<string>();
  readonly options = input.required<readonly SegmentOption[]>();
  readonly label = input.required<string>();
  readonly groupName = input('segmented-control');

  protected optionClass(option: SegmentOption): string {
    const base =
      'flex-1 cursor-pointer select-none rounded-lg px-3 py-2 text-center text-sm font-semibold transition-all duration-150 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600';

    if (option.disabled) {
      return `${base} cursor-not-allowed text-slate-400 dark:text-slate-600`;
    }

    return this.value() === option.value
      ? `${base} bg-white text-brand-700 shadow-sm dark:bg-slate-950 dark:text-brand-300`
      : `${base} text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white`;
  }
}
