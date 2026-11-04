import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

import { MAX_FILE_SIZE_BYTES, RejectedFile } from '../../../core/models/image.models';
import { ACCEPT_ATTRIBUTE, formatBytes } from '../../../core/utilities/file.utils';
import { DragDropDirective } from '../../directives/drag-drop.directive';
import { IconComponent } from '../icon/icon.component';

/**
 * Drag-and-drop upload zone with a visible Browse button.
 *
 * The whole zone is a labelled button so it can be reached and triggered from the
 * keyboard; the file input stays hidden but focusable-by-proxy.
 */
@Component({
  selector: 'app-file-uploader',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DragDropDirective, IconComponent],
  template: `
    <div
      appDragDrop
      #dropZone="appDragDrop"
      (filesDropped)="emit($event)"
      (click)="openPicker()"
      (keydown.enter)="openPicker()"
      (keydown.space)="openPicker(); $event.preventDefault()"
      role="button"
      tabindex="0"
      [attr.aria-label]="'Add images. ' + hint()"
      class="group relative flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed text-center transition-all duration-300"
      [class]="zoneClasses(dropZone.isDragging())"
    >
      <!-- Soft wash that lifts on hover, so the zone reads as the primary action -->
      <span
        class="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/[0.07] via-transparent to-accent-500/[0.07] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      ></span>

      <div class="relative flex items-center justify-center">
        <!-- Expanding ring, to signal the zone is live rather than a static box -->
        @if (!compact()) {
          <span
            class="animate-pulse-ring absolute inset-0 rounded-2xl bg-brand-500/30"
            aria-hidden="true"
          ></span>
        }
        <div
          class="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 text-white shadow-lift transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3"
          [class]="compact() ? 'size-11' : 'size-16'"
        >
          <app-icon name="upload" [size]="compact() ? 22 : 29" [strokeWidth]="1.8" />
        </div>
      </div>

      <p
        class="relative mt-5 font-bold text-slate-900 dark:text-white"
        [class]="compact() ? 'text-base' : 'text-xl sm:text-2xl'"
      >
        {{ heading() }}
      </p>

      <p class="relative mt-1.5 text-sm text-slate-500 dark:text-slate-400">
        or paste from the clipboard
      </p>

      <span
        class="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-6 py-3 text-sm font-bold text-white shadow-lift transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-glow"
        [class]="compact() ? '!mt-4 !px-4 !py-2 !text-xs' : ''"
      >
        <app-icon name="image" [size]="16" />
        Browse Files
      </span>

      <p class="relative mt-4 text-xs text-slate-400 dark:text-slate-500">{{ hint() }}</p>

      @if (dropZone.isDragging()) {
        <div
          class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-brand-600/95 text-white backdrop-blur-sm"
        >
          <span class="flex items-center gap-2 text-base font-semibold">
            <app-icon name="download" [size]="20" />
            Drop to add {{ multiple() ? 'images' : 'image' }}
          </span>
        </div>
      }
    </div>

    <input
      #fileInput
      type="file"
      class="sr-only"
      tabindex="-1"
      aria-hidden="true"
      [accept]="accept()"
      [multiple]="multiple()"
      (change)="onInputChange($event)"
    />

    @if (rejected().length > 0) {
      <ul class="mt-4 space-y-2" role="alert">
        @for (item of rejected(); track item.fileName + item.reason) {
          <li
            class="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
          >
            <app-icon name="alert" [size]="17" class="mt-0.5" />
            <span>{{ item.message }}</span>
          </li>
        }
      </ul>
    }
  `,
})
export class FileUploaderComponent {
  readonly multiple = input(true);
  readonly accept = input(ACCEPT_ATTRIBUTE);
  readonly maxSize = input(MAX_FILE_SIZE_BYTES);
  readonly compact = input(false);
  readonly heading = input('Drag & drop your images here');
  /** Rejected files to display under the zone; owned by the parent. */
  readonly rejected = input<readonly RejectedFile[]>([]);
  /** Listen for images pasted anywhere on the page. */
  readonly acceptPaste = input(true);

  readonly filesSelected = output<File[]>();

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly hint = computed(
    () => `JPG, PNG and WebP • up to ${formatBytes(this.maxSize(), 0)} per image`,
  );

  protected zoneClasses(isDragging: boolean): string {
    const base = this.compact() ? 'px-5 py-7' : 'px-6 py-12 sm:py-14';
    const state = isDragging
      ? 'border-brand-500 bg-brand-50 scale-[1.01] dark:border-brand-400 dark:bg-brand-500/10'
      : 'border-slate-300 bg-white/70 backdrop-blur-sm hover:border-brand-400 hover:shadow-soft dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-brand-500';
    return `${base} ${state}`;
  }

  constructor() {
    const document = inject(DOCUMENT);
    const destroyRef = inject(DestroyRef);

    // Screenshot to clipboard then straight into the tool is a genuinely fast
    // path, and it is what people try first after taking one.
    afterNextRender(() => {
      if (!this.acceptPaste()) {
        return;
      }

      const onPaste = (event: Event) => {
        const clipboard = (event as ClipboardEvent).clipboardData;
        if (!clipboard) {
          return;
        }

        const files = Array.from(clipboard.files ?? []).filter((file) =>
          file.type.startsWith('image/'),
        );

        if (files.length > 0) {
          event.preventDefault();
          this.emit(files);
        }
      };

      document.addEventListener('paste', onPaste);
      destroyRef.onDestroy(() => document.removeEventListener('paste', onPaste));
    });
  }

  protected openPicker(): void {
    this.fileInput().nativeElement.click();
  }

  protected onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    // Reset so selecting the same file twice in a row still fires a change event.
    input.value = '';
    if (files.length > 0) {
      this.emit(files);
    }
  }

  protected emit(files: File[]): void {
    this.filesSelected.emit(this.multiple() ? files : files.slice(0, 1));
  }
}
