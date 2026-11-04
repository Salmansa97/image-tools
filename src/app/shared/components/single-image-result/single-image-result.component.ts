import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ImageItem, ProcessedImage } from '../../../core/models/image.models';
import { DownloadButtonComponent } from '../download-button/download-button.component';
import { IconComponent, IconName } from '../icon/icon.component';
import { StatsSummaryComponent } from '../stats-summary/stats-summary.component';
import { FileSizePipe } from '../../pipes/file-size.pipe';
import { FormatLabelPipe } from '../../pipes/format-label.pipe';

/**
 * The "source on the left, result on the right" panel used by every
 * single-image editing tool.
 *
 * The live preview applies the *same* CSS filter or transform string the canvas
 * will use, so what a user sees before pressing the button is what they get
 * afterwards — the two cannot drift because they are driven by one value.
 */
@Component({
  selector: 'app-single-image-result',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DownloadButtonComponent,
    IconComponent,
    StatsSummaryComponent,
    FileSizePipe,
    FormatLabelPipe,
  ],
  template: `
    <div
      class="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="truncate text-base font-bold" [title]="item().fileName">
            {{ item().fileName }}
          </h2>
          <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {{ item().sourceType | formatLabel }} · {{ item().width }} × {{ item().height }} px ·
            {{ item().sourceSize | fileSize }}
          </p>
        </div>

        <button
          type="button"
          (click)="restart.emit()"
          class="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <app-icon name="refresh" [size]="14" />
          Start over
        </button>
      </div>

      <div class="grid gap-5 sm:grid-cols-2">
        <figure>
          <div
            class="checkerboard relative flex h-56 items-center justify-center overflow-hidden rounded-xl border border-slate-200 sm:h-72 dark:border-slate-800"
          >
            <img
              [src]="item().previewUrl"
              [alt]="'Preview of ' + item().fileName"
              decoding="async"
              class="max-h-full max-w-full object-contain transition-[filter,transform] duration-150"
              [style.filter]="previewFilter()"
              [style.transform]="previewTransform()"
            />
            <span
              class="absolute left-2.5 top-2.5 rounded-lg bg-slate-900/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm"
            >
              {{ previewLabel() }}
            </span>
          </div>
          <figcaption class="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            {{ previewCaption() || item().width + ' × ' + item().height + ' px' }}
          </figcaption>
        </figure>

        @if (result(); as output) {
          <figure>
            <div
              class="checkerboard relative flex h-56 items-center justify-center overflow-hidden rounded-xl border border-slate-200 sm:h-72 dark:border-slate-800"
            >
              <img
                [src]="output.url"
                [alt]="'Processed version of ' + item().fileName"
                decoding="async"
                class="max-h-full max-w-full object-contain"
              />
              <span
                class="absolute left-2.5 top-2.5 rounded-lg bg-brand-600/90 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm"
              >
                {{ resultLabel() }}
              </span>
            </div>
            <figcaption class="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
              {{ output.width }} × {{ output.height }} px
            </figcaption>
          </figure>
        } @else {
          <div
            class="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 px-5 text-center sm:h-72 dark:border-slate-700"
          >
            @if (busy()) {
              <app-icon
                name="spinner"
                [size]="26"
                svgClass="animate-spin"
                class="text-brand-600 dark:text-brand-400"
              />
              <p class="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                {{ busyLabel() }}
              </p>
            } @else {
              <app-icon
                [name]="emptyIcon()"
                [size]="26"
                class="text-slate-300 dark:text-slate-600"
              />
              <p class="mt-3 text-sm text-slate-500 dark:text-slate-400">{{ emptyText() }}</p>
              @if (emptyHint()) {
                <p class="mt-1 text-xs text-slate-400 dark:text-slate-500">{{ emptyHint() }}</p>
              }
            }
          </div>
        }
      </div>

      @if (result(); as output) {
        <div class="mt-6">
          @if (showStats()) {
            <app-stats-summary
              [originalSize]="item().sourceSize"
              [processedSize]="output.size"
              processedLabel="New Size"
              savedLabel="Difference"
            />
          }

          <div class="mt-4 flex flex-wrap items-center gap-3">
            <app-download-button
              [blob]="output.blob"
              [fileName]="output.fileName"
              size="lg"
              [label]="'Download ' + (output.type | formatLabel)"
            />
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {{ output.fileName }} · {{ output.size | fileSize }}
            </p>
          </div>
        </div>
      }
    </div>
  `,
})
export class SingleImageResultComponent {
  readonly item = input.required<ImageItem>();
  readonly result = input.required<ProcessedImage | null>();
  readonly busy = input(false);
  readonly busyLabel = input('Processing on your device…');

  readonly previewLabel = input('Preview');
  readonly resultLabel = input('Result');
  readonly previewCaption = input<string | null>(null);
  /** CSS `filter` applied to the live preview. */
  readonly previewFilter = input<string | null>(null);
  /** CSS `transform` applied to the live preview. */
  readonly previewTransform = input<string | null>(null);

  readonly emptyIcon = input<IconName>('sparkles');
  readonly emptyText = input('Your result will appear here.');
  readonly emptyHint = input<string | null>(null);
  readonly showStats = input(true);

  readonly restart = output<void>();
}
