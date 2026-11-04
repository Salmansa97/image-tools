import { Injectable, inject, signal } from '@angular/core';

import { ImageItem, ProcessedImage, RejectedFile } from '../models/image.models';
import { runWithConcurrency } from '../utilities/concurrency';
import { ImageBatchStore } from './image-batch.store';
import { ImageWorkerService, ProcessingCancelledError } from './image-worker.service';
import { ZipDownloadService } from './zip-download.service';

/**
 * Shared state and run loop for the tools that process many images at once.
 *
 * Extracted from the compressor and converter, which had grown identical copies
 * of the queue-mark/run/cancel/settle sequence — a sequence that is easy to get
 * subtly wrong, as the "cancel leaves items stuck in `queued`" bug showed.
 *
 * Provide alongside `ImageBatchStore` in the component's `providers`.
 */
@Injectable()
export class BatchSession {
  private readonly store = inject(ImageBatchStore);
  private readonly workers = inject(ImageWorkerService);
  private readonly zip = inject(ZipDownloadService);

  readonly rejected = signal<readonly RejectedFile[]>([]);
  readonly errorMessage = signal<string | null>(null);
  readonly zipping = signal(false);
  readonly zipPercent = signal(0);

  private controller: AbortController | null = null;

  async add(files: readonly File[]): Promise<void> {
    this.errorMessage.set(null);
    const rejected = await this.store.addFiles(files);
    this.rejected.set(rejected);
  }

  /**
   * Processes every loaded image, with the pool's concurrency and per-item status.
   *
   * Returns once the batch is finished or cancelled; items the runner never
   * reached are settled as cancelled rather than left queued forever.
   */
  async run(
    operation: (item: ImageItem, signal: AbortSignal) => Promise<ProcessedImage>,
  ): Promise<void> {
    if (this.store.isEmpty() || this.store.isProcessing()) {
      return;
    }

    this.errorMessage.set(null);
    this.store.clearResults();

    const controller = new AbortController();
    this.controller = controller;

    const items = this.store.items();
    for (const item of items) {
      this.store.setStatus(item.id, 'queued', 20);
    }

    await runWithConcurrency(
      items,
      this.workers.concurrency,
      async (item: ImageItem) => {
        if (controller.signal.aborted) {
          this.store.setStatus(item.id, 'cancelled', 100);
          return;
        }

        this.store.setStatus(item.id, 'processing', 60);

        try {
          const result = await operation(item, controller.signal);
          this.store.setResult(item.id, result);
        } catch (error) {
          if (error instanceof ProcessingCancelledError) {
            this.store.setStatus(item.id, 'cancelled', 100);
          } else {
            this.store.setError(
              item.id,
              error instanceof Error ? error.message : 'This image could not be processed.',
            );
          }
        }
      },
      controller.signal,
    );

    if (controller.signal.aborted) {
      this.store.cancelPending();
    }

    if (this.controller === controller) {
      this.controller = null;
    }
  }

  cancel(): void {
    this.controller?.abort();
    this.controller = null;
  }

  /** Packs every finished result into a ZIP and saves it. */
  async downloadZip(archiveName: string): Promise<void> {
    const completed = this.store.completed();
    if (completed.length === 0 || this.zipping()) {
      return;
    }

    this.zipping.set(true);
    this.zipPercent.set(0);
    this.errorMessage.set(null);

    try {
      await this.zip.downloadZip(
        completed
          .filter((item) => item.result)
          .map((item) => ({ fileName: item.result!.fileName, blob: item.result!.blob })),
        archiveName,
        (progress) => this.zipPercent.set(progress.percent),
      );
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'The ZIP archive could not be created.',
      );
    } finally {
      this.zipping.set(false);
    }
  }

  remove(id: string): void {
    this.store.remove(id);
  }

  reset(): void {
    this.cancel();
    this.store.clear();
    this.rejected.set([]);
    this.errorMessage.set(null);
  }
}
