import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

import { OutputFormat } from '../../../core/models/image.models';
import { resolveOutputFormat } from '../../../core/utilities/file.utils';
import { AlertComponent } from '../alert/alert.component';
import { QualitySliderComponent } from '../quality-slider/quality-slider.component';
import {
  SegmentedControlComponent,
  SegmentOption,
} from '../segmented-control/segmented-control.component';

const WITH_ORIGINAL: readonly SegmentOption[] = [
  { label: 'Original', value: 'original', hint: 'Keep the source format' },
  { label: 'JPG', value: 'image/jpeg', hint: 'Smallest for photographs; no transparency' },
  { label: 'PNG', value: 'image/png', hint: 'Lossless; keeps transparency' },
  { label: 'WebP', value: 'image/webp', hint: 'Usually the smallest overall' },
];

const EXPLICIT_ONLY: readonly SegmentOption[] = WITH_ORIGINAL.slice(1);

/**
 * The output format, quality and background controls, which every tool needs.
 *
 * Bundling them removes four near-identical copies of this markup and, more
 * usefully, puts the transparency rules in one place: whether the target keeps
 * alpha, whether PNG's "quality" is really a palette size, and whether a
 * background colour is about to be baked in.
 */
@Component({
  selector: 'app-output-format-field',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SegmentedControlComponent, QualitySliderComponent, AlertComponent],
  template: `
    <div class="space-y-6">
      @if (showFormat()) {
        <app-segmented-control
          [(value)]="format"
          [options]="options()"
          [label]="formatLabel()"
          [groupName]="idPrefix() + '-format'"
        />
      }

      @if (showQuality()) {
        <app-quality-slider
          [(value)]="quality"
          [inputId]="idPrefix() + '-quality'"
          label="Quality"
          [hintOverride]="qualityHint()"
        />
      }

      @if (needsBackground()) {
        <div>
          <label
            [attr.for]="idPrefix() + '-background'"
            class="mb-2 block text-sm font-semibold text-slate-900 dark:text-white"
          >
            {{ backgroundLabel() }}
          </label>
          <div class="flex items-center gap-3">
            <input
              [id]="idPrefix() + '-background'"
              type="color"
              class="size-10 cursor-pointer rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-950"
              [value]="background()"
              (input)="background.set($any($event.target).value)"
            />
            <span class="font-mono text-sm text-slate-600 dark:text-slate-400">
              {{ background() }}
            </span>
          </div>
        </div>

        @if (warnOnFlatten()) {
          <app-alert tone="warning" title="Transparency will be replaced">
            {{ flattenMessage() }}
          </app-alert>
        }
      }
    </div>
  `,
})
export class OutputFormatFieldComponent {
  readonly format = model.required<string>();
  readonly quality = model.required<number>();
  readonly background = model.required<string>();

  /** Source MIME type, used to resolve `original` and detect alpha loss. */
  readonly sourceType = input<string | null>(null);
  /** Set when more than one source could lose transparency. */
  readonly flattenCount = input(0);

  readonly showFormat = input(true);
  readonly showQuality = input(true);
  readonly allowOriginal = input(true);
  readonly formatLabel = input('Output format');
  readonly backgroundLabel = input('Background for transparent areas');
  readonly idPrefix = input('output');
  /** Force the colour picker on, for tools that always paint a background. */
  readonly alwaysShowBackground = input(false);

  protected readonly options = computed(() =>
    this.allowOriginal() ? WITH_ORIGINAL : EXPLICIT_ONLY,
  );

  protected readonly targetType = computed(() =>
    resolveOutputFormat(this.format() as OutputFormat, this.sourceType() ?? 'image/jpeg'),
  );

  protected readonly isLossless = computed(() => this.targetType() === 'image/png');

  /** True when the target format cannot carry the alpha the source might have. */
  protected readonly flattens = computed(() => {
    const source = this.sourceType();
    const sourceMayHaveAlpha = source === null || source === 'image/png' || source === 'image/webp';
    return this.targetType() === 'image/jpeg' && sourceMayHaveAlpha;
  });

  protected readonly needsBackground = computed(
    () => this.alwaysShowBackground() || this.flattens(),
  );

  protected readonly warnOnFlatten = computed(() => this.flattens());

  protected readonly flattenMessage = computed(() => {
    const count = this.flattenCount();
    if (count > 1) {
      return `${count} images have transparent areas, and JPEG cannot store them. Those areas will be filled with the colour above.`;
    }
    return 'JPEG cannot store an alpha channel, so any transparent areas will be filled with the colour above.';
  });

  protected readonly qualityHint = computed(() =>
    this.isLossless()
      ? 'PNG is lossless, so this controls how many colours are kept. Fewer colours means a smaller file.'
      : null,
  );
}
