import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { ImageItem } from '../../../core/models/image.models';
import { savingsPercent } from '../../../core/utilities/file.utils';
import { FileSizePipe } from '../../pipes/file-size.pipe';
import { FormatLabelPipe } from '../../pipes/format-label.pipe';
import { DownloadButtonComponent } from '../download-button/download-button.component';
import { IconComponent } from '../icon/icon.component';

/** One image in a batch list: preview, status, result stats and per-item actions. */
@Component({
  selector: 'app-image-card',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, DownloadButtonComponent, FileSizePipe, FormatLabelPipe],
  template: `
    <article
      class="animate-pop flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft transition-shadow hover:shadow-lift dark:border-slate-800 dark:bg-slate-900"
    >
      <div
        class="checkerboard relative size-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 sm:size-24 dark:border-slate-700"
      >
        <img
          [src]="item().previewUrl"
          [alt]="item().fileName"
          loading="lazy"
          decoding="async"
          class="size-full object-cover"
        />
        @if (item().status === 'processing' || item().status === 'queued') {
          <div
            class="absolute inset-0 flex items-center justify-center bg-slate-900/55 backdrop-blur-[1px]"
          >
            <app-icon name="spinner" [size]="20" svgClass="animate-spin" class="text-white" />
          </div>
        }
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h3
              class="truncate text-sm font-semibold text-slate-900 dark:text-white"
              [title]="item().fileName"
            >
              {{ item().fileName }}
            </h3>
            <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {{ item().sourceType | formatLabel }}
              @if (item().width > 0) {
                · {{ item().width }} × {{ item().height }} px
              }
              · {{ item().sourceSize | fileSize }}
            </p>
          </div>

          <button
            type="button"
            (click)="removed.emit(item().id)"
            class="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
            [attr.aria-label]="'Remove ' + item().fileName"
          >
            <app-icon name="trash" [size]="17" />
          </button>
        </div>

        @switch (item().status) {
          @case ('done') {
            @if (item().result; as result) {
              <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <span class="text-xs text-slate-400 line-through dark:text-slate-500">
                  {{ item().sourceSize | fileSize }}
                </span>
                <app-icon
                  name="arrow-right"
                  [size]="13"
                  class="text-slate-300 dark:text-slate-600"
                />
                <span class="text-sm font-bold text-slate-900 dark:text-white">
                  {{ result.size | fileSize }}
                </span>
                <span [class]="savingsBadgeClass()">{{ savingsLabel() }}</span>
                <span
                  class="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  {{ result.type | formatLabel }} · {{ result.width }} × {{ result.height }}
                </span>
              </div>

              <div class="mt-3">
                <app-download-button
                  [blob]="result.blob"
                  [fileName]="result.fileName"
                  variant="secondary"
                  size="sm"
                  label="Download"
                />
              </div>
            }
          }
          @case ('error') {
            <p
              class="mt-3 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
              role="alert"
            >
              <app-icon name="alert" [size]="15" class="mt-px shrink-0" />
              <span>{{ item().error }}</span>
            </p>
          }
          @case ('cancelled') {
            <p class="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Cancelled before it finished.
            </p>
          }
          @default {
            <div class="mt-3">
              <div
                class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                role="progressbar"
                [attr.aria-valuenow]="item().progress"
                aria-valuemin="0"
                aria-valuemax="100"
                [attr.aria-label]="'Progress for ' + item().fileName"
              >
                <div
                  class="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-[width] duration-300"
                  [style.width.%]="item().progress"
                ></div>
              </div>
              <p class="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{{ statusLabel() }}</p>
            </div>
          }
        }

        <ng-content />
      </div>
    </article>
  `,
})
export class ImageCardComponent {
  readonly item = input.required<ImageItem>();

  readonly removed = output<string>();

  protected readonly statusLabel = computed(() => {
    switch (this.item().status) {
      case 'queued':
        return 'Waiting in the queue…';
      case 'processing':
        return 'Processing on your device…';
      default:
        return 'Ready to process.';
    }
  });

  private readonly savings = computed(() => {
    const item = this.item();
    return item.result ? savingsPercent(item.sourceSize, item.result.size) : 0;
  });

  protected readonly savingsLabel = computed(() => {
    const value = this.savings();
    if (value > 0) {
      return `−${value}%`;
    }
    if (value === 0) {
      return 'Same size';
    }
    return `+${Math.abs(value)}% larger`;
  });

  protected readonly savingsBadgeClass = computed(() => {
    const base = 'rounded-md px-1.5 py-0.5 text-[11px] font-bold';
    return this.savings() > 0
      ? `${base} bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300`
      : `${base} bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300`;
  });
}
