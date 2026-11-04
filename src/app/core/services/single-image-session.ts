import { Injectable, computed, inject, signal } from '@angular/core';

import { ImageItem, ProcessedImage, RejectedFile } from '../models/image.models';
import { ImageBatchStore } from './image-batch.store';
import { ProcessingCancelledError } from './image-worker.service';

/**
 * Shared state for the tools that work on one image at a time.
 *
 * Every single-image tool needs the same five things: load a file, know when its
 * dimensions have been read, run an operation, surface the error if it fails, and
 * start over. Centralising that here is what keeps each tool component about its
 * own options rather than about plumbing.
 *
 * Provide alongside `ImageBatchStore` in the component's `providers`.
 */
@Injectable()
export class SingleImageSession {
  private readonly store = inject(ImageBatchStore);

  readonly items = this.store.items;

  readonly item = computed<ImageItem | null>(() => this.store.items()[0] ?? null);
  readonly result = computed(() => this.item()?.result ?? null);

  /**
   * Dimensions are decoded asynchronously, so an item exists before its size is
   * known. Tools stay hidden until this is true, otherwise their controls would
   * briefly read 0 × 0 and discard anything typed in the meantime.
   */
  readonly isMeasured = computed(() => (this.item()?.width ?? 0) > 0);
  readonly isProcessing = computed(() => this.item()?.status === 'processing');

  readonly rejected = signal<readonly RejectedFile[]>([]);
  readonly errorMessage = signal<string | null>(null);

  private controller: AbortController | null = null;

  /** Replaces whatever was loaded before with the first accepted file. */
  async load(files: readonly File[]): Promise<void> {
    this.cancel();
    this.errorMessage.set(null);
    this.store.clear();
    const rejected = await this.store.addFiles(files.slice(0, 1));
    this.rejected.set(rejected);
  }

  /**
   * Runs an operation against the loaded image, managing status, cancellation
   * and error reporting so each tool does not have to.
   */
  async run(
    operation: (item: ImageItem, signal: AbortSignal) => Promise<ProcessedImage>,
  ): Promise<void> {
    const item = this.item();
    if (!item || this.isProcessing()) {
      return;
    }

    this.errorMessage.set(null);
    this.store.setStatus(item.id, 'processing', 60);

    const controller = new AbortController();
    this.controller = controller;

    try {
      const result = await operation(item, controller.signal);
      this.store.setResult(item.id, result);
    } catch (error) {
      if (error instanceof ProcessingCancelledError) {
        this.store.setStatus(item.id, 'ready', 0);
      } else {
        const message =
          error instanceof Error ? error.message : 'This image could not be processed.';
        this.store.setError(item.id, message);
        this.errorMessage.set(message);
      }
    } finally {
      if (this.controller === controller) {
        this.controller = null;
      }
    }
  }

  cancel(): void {
    this.controller?.abort();
    this.controller = null;
  }

  /** Discards the stored result but keeps the loaded image. */
  clearResult(): void {
    this.store.clearResults();
  }

  reset(): void {
    this.cancel();
    this.store.clear();
    this.rejected.set([]);
    this.errorMessage.set(null);
  }
}
