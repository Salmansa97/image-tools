import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  signal,
  viewChild,
} from '@angular/core';

/**
 * Side-by-side comparison with a draggable divider.
 *
 * The divider is a real `role="slider"`, so it can be moved with the arrow keys
 * as well as by pointer — a drag-only control would be unusable without a mouse.
 */
@Component({
  selector: 'app-before-after-comparison',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full select-none">
      <div
        #stage
        class="checkerboard relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800"
        [class]="heightClass()"
        (pointerdown)="startDrag($event)"
        (pointermove)="onDrag($event)"
        (pointerup)="endDrag($event)"
        (pointercancel)="endDrag($event)"
      >
        <img
          [src]="afterSrc()"
          [alt]="afterAlt()"
          draggable="false"
          decoding="async"
          class="pointer-events-none absolute inset-0 size-full object-contain"
        />

        <div
          class="pointer-events-none absolute inset-0"
          [style.clipPath]="'inset(0 ' + (100 - position()) + '% 0 0)'"
        >
          <img
            [src]="beforeSrc()"
            [alt]="beforeAlt()"
            draggable="false"
            decoding="async"
            class="absolute inset-0 size-full object-contain"
          />
        </div>

        <span
          class="pointer-events-none absolute left-3 top-3 rounded-lg bg-slate-900/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm"
        >
          {{ beforeLabel() }}
        </span>
        <span
          class="pointer-events-none absolute right-3 top-3 rounded-lg bg-brand-600/90 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm"
        >
          {{ afterLabel() }}
        </span>

        <div
          class="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.25)]"
          [style.left.%]="position()"
        ></div>

        <button
          type="button"
          role="slider"
          [attr.aria-valuenow]="position()"
          aria-valuemin="0"
          aria-valuemax="100"
          [attr.aria-label]="'Comparison position: ' + position() + '%'"
          (keydown)="onKeydown($event)"
          class="absolute top-1/2 z-10 flex size-10 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lift transition-transform hover:scale-105 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          [style.left.%]="position()"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="m9 6-6 6 6 6M15 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      <p class="mt-2.5 text-center text-xs text-slate-500 dark:text-slate-400">
        Drag the handle, or focus it and use the arrow keys, to compare.
      </p>
    </div>
  `,
})
export class BeforeAfterComparisonComponent {
  readonly beforeSrc = input.required<string>();
  readonly afterSrc = input.required<string>();
  readonly beforeLabel = input('Original');
  readonly afterLabel = input('Processed');
  readonly beforeAlt = input('Original image');
  readonly afterAlt = input('Processed image');
  readonly heightClass = input('h-64 sm:h-96');

  private readonly stage = viewChild.required<ElementRef<HTMLDivElement>>('stage');
  private readonly positionState = signal(50);
  private dragging = false;

  protected readonly position = this.positionState.asReadonly();

  protected startDrag(event: PointerEvent): void {
    this.dragging = true;
    (event.target as Element).setPointerCapture?.(event.pointerId);
    this.updateFromPointer(event);
  }

  protected onDrag(event: PointerEvent): void {
    if (this.dragging) {
      this.updateFromPointer(event);
    }
  }

  protected endDrag(event: PointerEvent): void {
    this.dragging = false;
    (event.target as Element).releasePointerCapture?.(event.pointerId);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const step = event.shiftKey ? 10 : 2;
    let next: number | null = null;

    switch (event.key) {
      case 'ArrowLeft':
        next = this.positionState() - step;
        break;
      case 'ArrowRight':
        next = this.positionState() + step;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = 100;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.positionState.set(clamp(next));
  }

  private updateFromPointer(event: PointerEvent): void {
    const rect = this.stage().nativeElement.getBoundingClientRect();
    if (rect.width === 0) {
      return;
    }
    this.positionState.set(clamp(((event.clientX - rect.left) / rect.width) * 100));
  }
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}
