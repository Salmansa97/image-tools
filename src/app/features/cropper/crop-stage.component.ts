import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  computed,
  effect,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';

import { RotationAngle } from '../../core/models/image.models';
import { CropRect } from '../../core/services/image-crop.service';

type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

const HANDLES: readonly Handle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

/** Smallest crop, in image pixels, so the box can never collapse to nothing. */
const MIN_CROP = 24;

interface DragState {
  readonly mode: 'move' | 'resize' | 'draw';
  readonly handle: Handle | null;
  readonly startRect: CropRect;
  readonly startX: number;
  readonly startY: number;
  readonly pointerId: number;
}

/**
 * Interactive crop surface.
 *
 * Rotation and flipping are applied to the *display* with CSS, and the crop
 * rectangle is tracked in the coordinates of the rotated image. That way the
 * exported crop is a plain `drawImage` with the same rectangle — the component
 * and the worker never have to agree on a transform matrix.
 *
 * Zooming magnifies around the crop box rather than requiring a separate pan
 * gesture, which keeps every drag unambiguous: on the box it moves, on a handle
 * it resizes, anywhere else it draws a new selection.
 */
@Component({
  selector: 'app-crop-stage',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #stage
      class="checkerboard relative touch-none overflow-hidden rounded-xl border border-slate-200 select-none dark:border-slate-800"
      [class]="heightClass()"
      (pointerdown)="onPointerDown($event, 'draw', null)"
      (pointermove)="onPointerMove($event)"
      (pointerup)="onPointerUp($event)"
      (pointercancel)="onPointerUp($event)"
    >
      <!-- Rotated / flipped image -->
      <div
        class="pointer-events-none absolute"
        [style.left.px]="offsetX()"
        [style.top.px]="offsetY()"
        [style.width.px]="displayWidth()"
        [style.height.px]="displayHeight()"
      >
        <img
          [src]="src()"
          [alt]="alt()"
          draggable="false"
          decoding="async"
          class="absolute left-1/2 top-1/2 max-w-none"
          [style.width.px]="sourceWidth() * scale()"
          [style.height.px]="sourceHeight() * scale()"
          [style.transform]="imageTransform()"
        />
      </div>

      <!-- Dimmed area outside the selection -->
      <div
        class="pointer-events-none absolute inset-0 bg-slate-950/55"
        [style.clipPath]="maskPath()"
      ></div>

      <!-- Selection -->
      <div
        class="absolute cursor-move border-2 border-white shadow-[0_0_0_1px_rgba(15,23,42,0.4)]"
        [style.left.px]="rectLeft()"
        [style.top.px]="rectTop()"
        [style.width.px]="rectWidth()"
        [style.height.px]="rectHeight()"
        (pointerdown)="onPointerDown($event, 'move', null)"
        (keydown)="onKeydown($event, null)"
        tabindex="0"
        role="application"
        aria-label="Crop selection. Use the arrow keys to move it."
      >
        <!-- Rule-of-thirds guides -->
        <div class="pointer-events-none absolute inset-0 opacity-70">
          <span class="absolute inset-y-0 left-1/3 w-px bg-white/55"></span>
          <span class="absolute inset-y-0 left-2/3 w-px bg-white/55"></span>
          <span class="absolute inset-x-0 top-1/3 h-px bg-white/55"></span>
          <span class="absolute inset-x-0 top-2/3 h-px bg-white/55"></span>
        </div>

        @for (handle of handles; track handle) {
          <span
            [class]="handleClass(handle)"
            (pointerdown)="onPointerDown($event, 'resize', handle)"
            (keydown)="onKeydown($event, handle)"
            [attr.aria-label]="'Resize crop from the ' + handleLabel(handle) + ' edge'"
            tabindex="0"
            role="button"
          ></span>
        }
      </div>

      <!-- Live dimensions -->
      <p
        class="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-lg bg-slate-950/80 px-2.5 py-1 font-mono text-xs font-semibold text-white tabular-nums backdrop-blur-sm"
      >
        {{ rect().width }} × {{ rect().height }} px
      </p>
    </div>

    <p class="mt-2.5 text-center text-xs text-slate-500 dark:text-slate-400">
      Drag inside the box to move it, pull a handle to resize, or drag on the image to start a new
      selection. Tab to the box or a handle and use the arrow keys for pixel-precise nudges — hold
      Shift to move ten pixels at a time.
    </p>
  `,
})
export class CropStageComponent implements OnDestroy {
  readonly src = input.required<string>();
  readonly alt = input('Image being cropped');
  readonly sourceWidth = input.required<number>();
  readonly sourceHeight = input.required<number>();
  readonly rotate = input<RotationAngle>(0);
  readonly flipH = input(false);
  readonly flipV = input(false);
  readonly zoom = input(1);
  /** Locked aspect ratio (width ÷ height), or `null` for a free-form selection. */
  readonly ratio = input<number | null>(null);
  readonly heightClass = input('h-[22rem] sm:h-[30rem]');

  readonly rect = model.required<CropRect>();

  protected readonly handles = HANDLES;

  private readonly stage = viewChild.required<ElementRef<HTMLDivElement>>('stage');
  private readonly stageWidth = signal(0);
  private readonly stageHeight = signal(0);

  private drag: DragState | null = null;
  private observer: ResizeObserver | null = null;

  /** A 90° or 270° turn swaps the image's width and height. */
  private readonly isQuarterTurn = computed(() => this.rotate() === 90 || this.rotate() === 270);

  /** Image size after rotation, which is what the crop rectangle is measured in. */
  protected readonly boundsWidth = computed(() =>
    this.isQuarterTurn() ? this.sourceHeight() : this.sourceWidth(),
  );
  protected readonly boundsHeight = computed(() =>
    this.isQuarterTurn() ? this.sourceWidth() : this.sourceHeight(),
  );

  /** Pixels on screen per image pixel. */
  protected readonly scale = computed(() => {
    const stageW = this.stageWidth();
    const stageH = this.stageHeight();
    const boundsW = this.boundsWidth();
    const boundsH = this.boundsHeight();

    if (stageW === 0 || stageH === 0 || boundsW === 0 || boundsH === 0) {
      return 0;
    }
    const fit = Math.min(stageW / boundsW, stageH / boundsH);
    return fit * Math.max(0.1, this.zoom());
  });

  protected readonly displayWidth = computed(() => this.boundsWidth() * this.scale());
  protected readonly displayHeight = computed(() => this.boundsHeight() * this.scale());

  /**
   * At zoom 1 the image is centred; beyond that the view follows the crop box, so
   * magnifying never scrolls the selection off screen.
   */
  protected readonly offsetX = computed(() => {
    const stageW = this.stageWidth();
    if (this.zoom() <= 1) {
      return (stageW - this.displayWidth()) / 2;
    }
    const rect = this.rect();
    const focus = (rect.x + rect.width / 2) * this.scale();
    return clampOffset(stageW / 2 - focus, stageW, this.displayWidth());
  });

  protected readonly offsetY = computed(() => {
    const stageH = this.stageHeight();
    if (this.zoom() <= 1) {
      return (stageH - this.displayHeight()) / 2;
    }
    const rect = this.rect();
    const focus = (rect.y + rect.height / 2) * this.scale();
    return clampOffset(stageH / 2 - focus, stageH, this.displayHeight());
  });

  protected readonly imageTransform = computed(
    () =>
      `translate(-50%, -50%) rotate(${this.rotate()}deg) scale(${this.flipH() ? -1 : 1}, ${
        this.flipV() ? -1 : 1
      })`,
  );

  protected readonly rectLeft = computed(() => this.offsetX() + this.rect().x * this.scale());
  protected readonly rectTop = computed(() => this.offsetY() + this.rect().y * this.scale());
  protected readonly rectWidth = computed(() => this.rect().width * this.scale());
  protected readonly rectHeight = computed(() => this.rect().height * this.scale());

  /** Punches the selection out of the dimming overlay. */
  protected readonly maskPath = computed(() => {
    const left = this.rectLeft();
    const top = this.rectTop();
    const right = left + this.rectWidth();
    const bottom = top + this.rectHeight();
    return (
      'polygon(' +
      '0 0, 100% 0, 100% 100%, 0 100%, 0 0, ' +
      `${left}px ${top}px, ${left}px ${bottom}px, ${right}px ${bottom}px, ${right}px ${top}px, ${left}px ${top}px)`
    );
  });

  constructor() {
    afterNextRender(() => {
      const element = this.stage().nativeElement;
      this.measure(element);

      if (typeof ResizeObserver !== 'undefined') {
        this.observer = new ResizeObserver(() => this.measure(element));
        this.observer.observe(element);
      }
    });

    // A rotation changes the coordinate space the rectangle lives in, so an old
    // rectangle would be meaningless. Re-clamp it into the new bounds.
    effect(() => {
      const boundsW = this.boundsWidth();
      const boundsH = this.boundsHeight();
      if (boundsW === 0 || boundsH === 0) {
        return;
      }
      const current = this.rect();
      const clamped = clampRect(current, boundsW, boundsH);
      if (!sameRect(current, clamped)) {
        this.rect.set(clamped);
      }
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  protected handleClass(handle: Handle): string {
    const base =
      'absolute block size-3.5 rounded-sm border-2 border-brand-600 bg-white shadow-sm dark:border-brand-400';
    const positions: Record<Handle, string> = {
      nw: '-left-2 -top-2 cursor-nwse-resize',
      n: 'left-1/2 -top-2 -translate-x-1/2 cursor-ns-resize',
      ne: '-right-2 -top-2 cursor-nesw-resize',
      e: '-right-2 top-1/2 -translate-y-1/2 cursor-ew-resize',
      se: '-right-2 -bottom-2 cursor-nwse-resize',
      s: 'left-1/2 -bottom-2 -translate-x-1/2 cursor-ns-resize',
      sw: '-left-2 -bottom-2 cursor-nesw-resize',
      w: '-left-2 top-1/2 -translate-y-1/2 cursor-ew-resize',
    };
    return `${base} ${positions[handle]}`;
  }

  protected handleLabel(handle: Handle): string {
    const labels: Record<Handle, string> = {
      nw: 'top left',
      n: 'top',
      ne: 'top right',
      e: 'right',
      se: 'bottom right',
      s: 'bottom',
      sw: 'bottom left',
      w: 'left',
    };
    return labels[handle];
  }

  protected onPointerDown(
    event: PointerEvent,
    mode: DragState['mode'],
    handle: Handle | null,
  ): void {
    if (event.button !== 0 && event.pointerType === 'mouse') {
      return;
    }
    // A handle sits inside the box, which sits inside the stage: stop the event
    // so only the most specific target starts a drag.
    event.stopPropagation();
    event.preventDefault();

    const point = this.toImagePoint(event);
    if (!point) {
      return;
    }

    (event.target as Element).setPointerCapture?.(event.pointerId);

    if (mode === 'draw') {
      const seed: CropRect = { x: point.x, y: point.y, width: MIN_CROP, height: MIN_CROP };
      this.drag = {
        mode: 'draw',
        handle: 'se',
        startRect: seed,
        startX: point.x,
        startY: point.y,
        pointerId: event.pointerId,
      };
      return;
    }

    this.drag = {
      mode,
      handle,
      startRect: this.rect(),
      startX: point.x,
      startY: point.y,
      pointerId: event.pointerId,
    };
  }

  protected onPointerMove(event: PointerEvent): void {
    const drag = this.drag;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const point = this.toImagePoint(event);
    if (!point) {
      return;
    }

    event.preventDefault();

    if (drag.mode === 'move') {
      this.rect.set(
        clampRect(
          {
            ...drag.startRect,
            x: drag.startRect.x + (point.x - drag.startX),
            y: drag.startRect.y + (point.y - drag.startY),
          },
          this.boundsWidth(),
          this.boundsHeight(),
        ),
      );
      return;
    }

    if (drag.mode === 'draw') {
      this.rect.set(this.rectFromDrawing(drag.startX, drag.startY, point.x, point.y));
      return;
    }

    if (drag.handle) {
      this.rect.set(this.rectFromResize(drag.startRect, drag.handle, point.x, point.y));
    }
  }

  protected onPointerUp(event: PointerEvent): void {
    if (this.drag?.pointerId === event.pointerId) {
      (event.target as Element).releasePointerCapture?.(event.pointerId);
      this.drag = null;
    }
  }

  private measure(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    this.stageWidth.set(rect.width);
    this.stageHeight.set(rect.height);
  }

  /** Converts a pointer position into image pixels inside the rotated bitmap. */
  private toImagePoint(event: PointerEvent): { x: number; y: number } | null {
    const scale = this.scale();
    if (scale === 0) {
      return null;
    }
    const stageRect = this.stage().nativeElement.getBoundingClientRect();
    return {
      x: (event.clientX - stageRect.left - this.offsetX()) / scale,
      y: (event.clientY - stageRect.top - this.offsetY()) / scale,
    };
  }

  private rectFromDrawing(startX: number, startY: number, endX: number, endY: number): CropRect {
    const boundsW = this.boundsWidth();
    const boundsH = this.boundsHeight();

    let width = Math.abs(endX - startX);
    let height = Math.abs(endY - startY);
    const ratio = this.ratio();

    if (ratio !== null) {
      // Grow along whichever axis the pointer travelled furthest.
      if (width / ratio >= height) {
        height = width / ratio;
      } else {
        width = height * ratio;
      }
    }

    width = Math.max(MIN_CROP, width);
    height = Math.max(MIN_CROP, height);

    const x = endX >= startX ? startX : startX - width;
    const y = endY >= startY ? startY : startY - height;

    return clampRect({ x, y, width, height }, boundsW, boundsH, ratio);
  }

  private rectFromResize(
    start: CropRect,
    handle: Handle,
    pointerX: number,
    pointerY: number,
  ): CropRect {
    const boundsW = this.boundsWidth();
    const boundsH = this.boundsHeight();

    let left = start.x;
    let top = start.y;
    let right = start.x + start.width;
    let bottom = start.y + start.height;

    if (handle.includes('w')) {
      left = Math.min(Math.max(0, pointerX), right - MIN_CROP);
    }
    if (handle.includes('e')) {
      right = Math.max(Math.min(boundsW, pointerX), left + MIN_CROP);
    }
    if (handle.includes('n')) {
      top = Math.min(Math.max(0, pointerY), bottom - MIN_CROP);
    }
    if (handle.includes('s')) {
      bottom = Math.max(Math.min(boundsH, pointerY), top + MIN_CROP);
    }

    let next: CropRect = { x: left, y: top, width: right - left, height: bottom - top };

    const ratio = this.ratio();
    if (ratio !== null) {
      next = applyRatio(next, handle, ratio);
    }

    return clampRect(next, boundsW, boundsH, ratio);
  }

  /**
   * Keyboard equivalents for every pointer gesture: arrows move the selection,
   * or move one edge when a handle has focus.
   */
  protected onKeydown(event: KeyboardEvent, handle: Handle | null): void {
    const step = event.shiftKey ? 10 : 1;
    let dx = 0;
    let dy = 0;

    switch (event.key) {
      case 'ArrowLeft':
        dx = -step;
        break;
      case 'ArrowRight':
        dx = step;
        break;
      case 'ArrowUp':
        dy = -step;
        break;
      case 'ArrowDown':
        dy = step;
        break;
      default:
        return;
    }

    event.preventDefault();
    const current = this.rect();

    if (handle === null) {
      this.rect.set(
        clampRect(
          { ...current, x: current.x + dx, y: current.y + dy },
          this.boundsWidth(),
          this.boundsHeight(),
        ),
      );
      return;
    }

    // Move the dragged edge to where a pointer would have put it.
    const pointerX = (handle.includes('w') ? current.x : current.x + current.width) + dx;
    const pointerY = (handle.includes('n') ? current.y : current.y + current.height) + dy;
    this.rect.set(this.rectFromResize(current, handle, pointerX, pointerY));
  }
}

/* -------------------------------------------------------------------------- */
/* Geometry helpers                                                           */
/* -------------------------------------------------------------------------- */

function applyRatio(rect: CropRect, handle: Handle, ratio: number): CropRect {
  const horizontal = handle.includes('w') || handle.includes('e');
  const vertical = handle.includes('n') || handle.includes('s');

  let width = rect.width;
  let height = rect.height;

  if (horizontal) {
    height = width / ratio;
  } else {
    width = height * ratio;
  }

  // Anchor the edge or corner the user is *not* dragging.
  let x: number;
  let y: number;

  if (handle.includes('w')) {
    x = rect.x + rect.width - width;
  } else if (handle.includes('e')) {
    x = rect.x;
  } else {
    x = rect.x + rect.width / 2 - width / 2;
  }

  if (handle.includes('n')) {
    y = rect.y + rect.height - height;
  } else if (handle.includes('s')) {
    y = rect.y;
  } else {
    y = rect.y + rect.height / 2 - height / 2;
  }

  // A corner drag anchors both axes at the opposite corner.
  if (horizontal && vertical) {
    x = handle.includes('w') ? rect.x + rect.width - width : rect.x;
    y = handle.includes('n') ? rect.y + rect.height - height : rect.y;
  }

  return { x, y, width, height };
}

function clampRect(
  rect: CropRect,
  boundsWidth: number,
  boundsHeight: number,
  ratio: number | null = null,
): CropRect {
  let width = Math.max(MIN_CROP, rect.width);
  let height = Math.max(MIN_CROP, rect.height);

  if (ratio !== null) {
    // Shrink along both axes together so the ratio survives the clamp.
    if (width > boundsWidth) {
      width = boundsWidth;
      height = width / ratio;
    }
    if (height > boundsHeight) {
      height = boundsHeight;
      width = height * ratio;
    }
  } else {
    width = Math.min(width, boundsWidth);
    height = Math.min(height, boundsHeight);
  }

  const x = Math.min(Math.max(0, rect.x), Math.max(0, boundsWidth - width));
  const y = Math.min(Math.max(0, rect.y), Math.max(0, boundsHeight - height));

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  };
}

function sameRect(a: CropRect, b: CropRect): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

function clampOffset(offset: number, stageSize: number, displaySize: number): number {
  if (displaySize <= stageSize) {
    return (stageSize - displaySize) / 2;
  }
  return Math.min(0, Math.max(stageSize - displaySize, offset));
}
