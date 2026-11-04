import { Injectable, OnDestroy, computed, signal } from '@angular/core';

import { ImageItem, ImageStatus, ProcessedImage, RejectedFile } from '../models/image.models';
import {
  baseNameOf,
  detectMimeType,
  fileKey,
  validateFilesByContent,
} from '../utilities/file.utils';
import { readImageSize } from '../utilities/image-processor';

let sequence = 0;

function nextId(): string {
  sequence += 1;
  return `img-${sequence}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Signal-backed state for a batch of images inside one tool.
 *
 * Provided per feature component rather than in the root injector, so navigating
 * between tools starts from a clean slate and releases the previous tool's memory.
 *
 * Every object URL created here is revoked on replacement, removal or teardown —
 * forgetting that is the fastest way to leak hundreds of megabytes in a tab.
 */
@Injectable()
export class ImageBatchStore implements OnDestroy {
  private readonly itemsState = signal<readonly ImageItem[]>([]);

  readonly items = this.itemsState.asReadonly();

  readonly count = computed(() => this.itemsState().length);
  readonly isEmpty = computed(() => this.itemsState().length === 0);

  readonly completed = computed(() => this.itemsState().filter((item) => item.status === 'done'));
  readonly failed = computed(() => this.itemsState().filter((item) => item.status === 'error'));

  readonly isProcessing = computed(() =>
    this.itemsState().some((item) => item.status === 'processing' || item.status === 'queued'),
  );

  readonly hasResults = computed(() => this.completed().length > 0);

  readonly totalSourceSize = computed(() =>
    this.itemsState().reduce((total, item) => total + item.sourceSize, 0),
  );

  readonly totalResultSize = computed(() =>
    this.completed().reduce((total, item) => total + (item.result?.size ?? 0), 0),
  );

  /** Source size of only those images that finished, for an honest savings figure. */
  readonly comparableSourceSize = computed(() =>
    this.completed().reduce((total, item) => total + item.sourceSize, 0),
  );

  /** Mean of every item's progress, so the overall bar moves smoothly. */
  readonly overallProgress = computed(() => {
    const items = this.itemsState();
    if (items.length === 0) {
      return 0;
    }
    const total = items.reduce((sum, item) => sum + item.progress, 0);
    return Math.round(total / items.length);
  });

  /**
   * Adds files after validation, returning anything that was rejected so the
   * caller can surface a message. Dimensions are filled in asynchronously.
   */
  async addFiles(files: readonly File[]): Promise<readonly RejectedFile[]> {
    const existingKeys = new Set(this.itemsState().map((item) => fileKey(item.file)));
    // Content-based: the declared type comes from the extension and cannot be trusted.
    const { accepted, rejected } = await validateFilesByContent(files, { existingKeys });

    if (accepted.length === 0) {
      return rejected;
    }

    const types = await Promise.all(accepted.map((file) => detectMimeType(file)));

    const created = accepted.map<ImageItem>((file, index) => ({
      id: nextId(),
      file,
      fileName: file.name,
      baseName: baseNameOf(file.name),
      sourceType: types[index],
      sourceSize: file.size,
      previewUrl: URL.createObjectURL(file),
      width: 0,
      height: 0,
      status: 'ready',
      progress: 0,
    }));

    this.itemsState.update((items) => [...items, ...created]);

    const unreadable: RejectedFile[] = [];

    await Promise.all(
      created.map(async (item) => {
        try {
          const { width, height } = await readImageSize(item.file);
          this.patch(item.id, { width, height });
        } catch (error) {
          // A file can pass every header check and still fail to decode — it may
          // be truncated, or large enough to exhaust memory.
          this.remove(item.id);
          unreadable.push({
            fileName: item.fileName,
            reason: 'empty',
            message:
              error instanceof Error && error.name === 'ImageTooLargeError'
                ? `“${item.fileName}”: ${error.message}`
                : `“${item.fileName}” could not be opened — the file looks corrupted.`,
          });
        }
      }),
    );

    return [...rejected, ...unreadable];
  }

  patch(id: string, changes: Partial<Omit<ImageItem, 'id' | 'file'>>): void {
    this.itemsState.update((items) =>
      items.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  }

  setStatus(id: string, status: ImageStatus, progress?: number): void {
    this.patch(id, { status, ...(progress === undefined ? {} : { progress }) });
  }

  /** Stores a result, revoking the URL of any result it replaces. */
  setResult(id: string, result: ProcessedImage): void {
    const previous = this.itemsState().find((item) => item.id === id)?.result;
    if (previous && previous.url !== result.url) {
      URL.revokeObjectURL(previous.url);
    }
    this.patch(id, { status: 'done', progress: 100, result, error: undefined });
  }

  setError(id: string, message: string): void {
    this.patch(id, { status: 'error', progress: 100, error: message, result: undefined });
  }

  /**
   * Marks everything still queued or in flight as cancelled.
   *
   * Aborting a batch stops the runner immediately, which leaves any images it
   * never reached sitting in `queued`. Without this they would keep the tool in
   * a permanent "processing" state and the action button would stay disabled.
   */
  cancelPending(): void {
    this.itemsState.update((items) =>
      items.map((item) =>
        item.status === 'queued' || item.status === 'processing'
          ? { ...item, status: 'cancelled' as const, progress: 100 }
          : item,
      ),
    );
  }

  /** Drops every stored result, returning items to the `ready` state. */
  clearResults(): void {
    this.itemsState.update((items) =>
      items.map((item) => {
        if (item.result) {
          URL.revokeObjectURL(item.result.url);
        }
        return { ...item, status: 'ready', progress: 0, result: undefined, error: undefined };
      }),
    );
  }

  remove(id: string): void {
    const item = this.itemsState().find((candidate) => candidate.id === id);
    if (!item) {
      return;
    }
    this.release(item);
    this.itemsState.update((items) => items.filter((candidate) => candidate.id !== id));
  }

  clear(): void {
    for (const item of this.itemsState()) {
      this.release(item);
    }
    this.itemsState.set([]);
  }

  ngOnDestroy(): void {
    this.clear();
  }

  private release(item: ImageItem): void {
    URL.revokeObjectURL(item.previewUrl);
    if (item.result) {
      URL.revokeObjectURL(item.result.url);
    }
  }
}
