import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { ImageBatchStore } from '../../core/services/image-batch.store';
import { SeoService } from '../../core/services/seo.service';
import { SingleImageSession } from '../../core/services/single-image-session';
import { UploadHandoffService } from '../../core/services/upload-handoff.service';
import { SwatchColor, describeColor, extractPalette } from '../../core/utilities/color';
import { decodeImage } from '../../core/utilities/image-processor';
import { toolPageSeo } from '../../seo/tool-page-seo';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { CopyButtonComponent } from '../../shared/components/copy-button/copy-button.component';
import { FileUploaderComponent } from '../../shared/components/file-uploader/file-uploader.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ToolPageComponent } from '../../shared/components/tool-page/tool-page.component';
import { COLORS_CONTENT } from './colors.content';

/** Longest edge the sampling canvas uses; plenty for picking, cheap to hold. */
const SAMPLE_MAX_EDGE = 1600;

@Component({
  selector: 'app-colors',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ImageBatchStore, SingleImageSession],
  imports: [
    ToolPageComponent,
    FileUploaderComponent,
    CopyButtonComponent,
    IconComponent,
    AlertComponent,
  ],
  templateUrl: './colors.component.html',
})
export class ColorsComponent {
  private readonly handoff = inject(UploadHandoffService);
  private readonly seo = inject(SeoService);

  protected readonly session = inject(SingleImageSession);
  protected readonly content = COLORS_CONTENT;

  protected readonly item = this.session.item;

  private readonly stage = viewChild<ElementRef<HTMLDivElement>>('stage');

  /** Pixels of the (possibly downscaled) sampling copy. */
  private pixels: ImageData | null = null;

  protected readonly palette = signal<readonly SwatchColor[]>([]);
  protected readonly picked = signal<SwatchColor | null>(null);
  /** Crosshair position as a fraction of the displayed image, 0–1. */
  protected readonly markerX = signal(0.5);
  protected readonly markerY = signal(0.5);
  protected readonly analysing = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly hasPalette = computed(() => this.palette().length > 0);

  /** The palette as CSS custom properties, ready to paste into a stylesheet. */
  protected readonly paletteCss = computed(() => {
    const colors = this.palette();
    if (colors.length === 0) {
      return '';
    }
    const lines = colors.map((color, index) => `  --color-${index + 1}: ${color.hex};`);
    return `:root {\n${lines.join('\n')}\n}`;
  });

  protected readonly paletteList = computed(() =>
    this.palette()
      .map((color) => color.hex)
      .join(', '),
  );

  constructor() {
    this.seo.apply(toolPageSeo(COLORS_CONTENT));

    afterNextRender(() => {
      const staged = this.handoff.claim();
      if (staged.length > 0) {
        void this.addFiles([...staged]);
      }
    });
  }

  protected async addFiles(files: File[]): Promise<void> {
    this.reset(false);
    await this.session.load(files);

    const item = this.item();
    if (!item) {
      return;
    }

    this.analysing.set(true);
    try {
      this.pixels = await this.readPixels(item.file);
      this.palette.set(extractPalette(this.pixels.data, 8));
      // Seed the readout with the centre pixel so the panel is never empty.
      this.sampleAt(0.5, 0.5);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'This image could not be analysed.',
      );
    } finally {
      this.analysing.set(false);
    }
  }

  /**
   * Draws the image to a canvas at a bounded size and reads it back once.
   *
   * Sampling from a stored `ImageData` rather than re-reading the canvas on every
   * click keeps picking instant, and the size cap keeps a 50-megapixel photo from
   * holding 200 MB of RGBA in memory for the sake of an eyedropper.
   */
  private async readPixels(file: File): Promise<ImageData> {
    const decoded = await decodeImage(file);
    try {
      const scale = Math.min(1, SAMPLE_MAX_EDGE / Math.max(decoded.width, decoded.height));
      const width = Math.max(1, Math.round(decoded.width * scale));
      const height = Math.max(1, Math.round(decoded.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        throw new Error('Could not read the image’s pixels in this browser.');
      }
      ctx.drawImage(decoded.source, 0, 0, width, height);
      const data = ctx.getImageData(0, 0, width, height);

      canvas.width = 0;
      canvas.height = 0;
      return data;
    } finally {
      decoded.release();
    }
  }

  protected onPointer(event: PointerEvent): void {
    const element = this.stage()?.nativeElement;
    if (!element) {
      return;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }
    this.sampleAt(
      (event.clientX - rect.left) / rect.width,
      (event.clientY - rect.top) / rect.height,
    );
  }

  protected onKeydown(event: KeyboardEvent): void {
    const step = event.shiftKey ? 0.05 : 0.005;
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
    this.sampleAt(this.markerX() + dx, this.markerY() + dy);
  }

  protected useSwatch(color: SwatchColor): void {
    this.picked.set(color);
  }

  /** Samples the stored pixel data at a fractional position. */
  private sampleAt(fx: number, fy: number): void {
    const data = this.pixels;
    if (!data) {
      return;
    }

    const x = clamp01(fx);
    const y = clamp01(fy);
    this.markerX.set(x);
    this.markerY.set(y);

    const px = Math.min(data.width - 1, Math.max(0, Math.round(x * (data.width - 1))));
    const py = Math.min(data.height - 1, Math.max(0, Math.round(y * (data.height - 1))));
    const offset = (py * data.width + px) * 4;

    this.picked.set(
      describeColor({
        r: data.data[offset],
        g: data.data[offset + 1],
        b: data.data[offset + 2],
      }),
    );
  }

  protected reset(clearSession = true): void {
    this.pixels = null;
    this.palette.set([]);
    this.picked.set(null);
    this.errorMessage.set(null);
    this.markerX.set(0.5);
    this.markerY.set(0.5);
    if (clearSession) {
      this.session.reset();
    }
  }
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
