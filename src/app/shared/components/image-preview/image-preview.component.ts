import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Renders an image on a checkerboard so alpha is visible rather than being
 * mistaken for white, with a fixed aspect box so the layout never jumps while
 * the bitmap decodes.
 */
@Component({
  selector: 'app-image-preview',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="w-full">
      <div
        class="checkerboard relative flex items-center justify-center overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800"
        [class]="heightClass()"
      >
        <img
          [src]="src()"
          [alt]="alt()"
          loading="lazy"
          decoding="async"
          class="max-h-full max-w-full object-contain"
        />

        @if (badge()) {
          <span
            class="absolute left-2.5 top-2.5 rounded-lg bg-slate-900/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm"
          >
            {{ badge() }}
          </span>
        }
      </div>

      @if (caption()) {
        <figcaption class="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          {{ caption() }}
        </figcaption>
      }
    </figure>
  `,
})
export class ImagePreviewComponent {
  readonly src = input.required<string>();
  readonly alt = input('Image preview');
  readonly badge = input<string | null>(null);
  readonly caption = input<string | null>(null);
  readonly heightClass = input('h-56 sm:h-72');
}
