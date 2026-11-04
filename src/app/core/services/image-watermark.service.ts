import { Injectable, inject } from '@angular/core';

import { ImageItem, OutputFormat, ProcessedImage, WatermarkPosition } from '../models/image.models';
import { ImageWorkerService } from './image-worker.service';
import { toProcessedImage } from './processed-image.factory';

export interface WatermarkSettings {
  readonly mode: 'text' | 'image';
  readonly text: string;
  readonly fontFamily: string;
  readonly fontScale: number;
  readonly color: string;
  readonly opacity: number;
  readonly position: WatermarkPosition;
  readonly margin: number;
  readonly rotation: number;
  readonly tile: boolean;
  readonly tileGap: number;
  readonly imageScale: number;
  readonly shadow: boolean;
  readonly format: OutputFormat;
  readonly quality: number;
  readonly background: string;
}

export const WATERMARK_POSITIONS: readonly {
  value: WatermarkPosition;
  label: string;
}[] = [
  { value: 'top-left', label: 'Top left' },
  { value: 'top-center', label: 'Top centre' },
  { value: 'top-right', label: 'Top right' },
  { value: 'middle-left', label: 'Middle left' },
  { value: 'center', label: 'Centre' },
  { value: 'middle-right', label: 'Middle right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-center', label: 'Bottom centre' },
  { value: 'bottom-right', label: 'Bottom right' },
];

/** Font stacks that are safe to rely on without loading a webfont. */
export const WATERMARK_FONTS: readonly { value: string; label: string }[] = [
  { value: 'system-ui, -apple-system, "Segoe UI", sans-serif', label: 'System sans-serif' },
  { value: 'Georgia, "Times New Roman", serif', label: 'Serif' },
  { value: '"Courier New", ui-monospace, monospace', label: 'Monospace' },
  { value: 'Impact, "Arial Black", sans-serif', label: 'Heavy display' },
];

@Injectable({ providedIn: 'root' })
export class ImageWatermarkService {
  private readonly workers = inject(ImageWorkerService);

  apply(
    item: ImageItem,
    settings: WatermarkSettings,
    overlay: Blob | null,
    signal?: AbortSignal,
  ): Promise<ProcessedImage> {
    return this.workers
      .process(
        item.file,
        {
          kind: 'watermark',
          mode: settings.mode,
          text: settings.text,
          fontFamily: settings.fontFamily,
          fontScale: settings.fontScale,
          color: settings.color,
          opacity: settings.opacity,
          position: settings.position,
          margin: settings.margin,
          rotation: settings.rotation,
          tile: settings.tile,
          tileGap: settings.tileGap,
          imageScale: settings.imageScale,
          overlay: overlay ?? undefined,
          shadow: settings.shadow,
          format: settings.format,
          quality: settings.quality,
          background: settings.background,
        },
        signal,
      )
      .then((result) => toProcessedImage(result, item.baseName, 'watermarked'));
  }
}
