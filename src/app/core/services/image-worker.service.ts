import { Injectable, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import {
  ProcessOptions,
  ProcessOutput,
  WorkerRequest,
  WorkerResponse,
} from '../models/image.models';
import { canProcessImages, processImage } from '../utilities/image-processor';

interface PendingTask {
  readonly id: string;
  readonly file: Blob;
  readonly options: ProcessOptions;
  readonly resolve: (value: ProcessOutput) => void;
  readonly reject: (reason: Error) => void;
  readonly signal?: AbortSignal;
  readonly onAbort?: () => void;
}

interface PooledWorker {
  worker: Worker;
  task: PendingTask | null;
}

/** Raised when a caller aborts a task. Features use this to stay quiet about it. */
export class ProcessingCancelledError extends Error {
  constructor() {
    super('Processing was cancelled.');
    this.name = 'ProcessingCancelledError';
  }
}

/**
 * A small pool of image workers with a FIFO queue.
 *
 * Browsers cap how much decoded image data can live at once, so we deliberately
 * keep the pool small: four large photos in flight is plenty to saturate the
 * encoder without risking an out-of-memory tab crash on mobile.
 */
@Injectable({ providedIn: 'root' })
export class ImageWorkerService implements OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly pool: PooledWorker[] = [];
  private readonly queue: PendingTask[] = [];
  private taskCounter = 0;

  /** `null` until the first task tells us whether workers are usable here. */
  private workersUsable: boolean | null = null;

  /** How many images may be processed at once. */
  readonly concurrency = this.resolveConcurrency();

  /**
   * Runs one operation, in a worker when possible and on the main thread otherwise.
   * Pass `signal` to make the task abortable.
   */
  process(file: Blob, options: ProcessOptions, signal?: AbortSignal): Promise<ProcessOutput> {
    if (signal?.aborted) {
      return Promise.reject(new ProcessingCancelledError());
    }

    if (!this.isBrowser) {
      return Promise.reject(new Error('Images can only be processed in the browser.'));
    }

    if (!this.canUseWorkers()) {
      return this.processOnMainThread(file, options, signal);
    }

    return new Promise<ProcessOutput>((resolve, reject) => {
      this.taskCounter += 1;
      const id = `task-${this.taskCounter}`;

      const task: PendingTask = {
        id,
        file,
        options,
        resolve,
        reject,
        signal,
        onAbort: () => this.abortTask(id),
      };

      if (signal && task.onAbort) {
        signal.addEventListener('abort', task.onAbort, { once: true });
      }

      this.queue.push(task);
      this.pump();
    });
  }

  /** Tears down every worker and rejects everything in flight. */
  terminateAll(): void {
    for (const slot of this.pool) {
      if (slot.task) {
        this.settleReject(slot.task, new ProcessingCancelledError());
      }
      slot.worker.terminate();
    }
    this.pool.length = 0;

    for (const task of this.queue.splice(0)) {
      this.settleReject(task, new ProcessingCancelledError());
    }
  }

  ngOnDestroy(): void {
    this.terminateAll();
  }

  /* ---------------------------------------------------------------------- */

  private canUseWorkers(): boolean {
    if (this.workersUsable !== null) {
      return this.workersUsable;
    }
    this.workersUsable = typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';
    return this.workersUsable;
  }

  private resolveConcurrency(): number {
    if (!this.isBrowser) {
      return 1;
    }
    const cores = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency ?? 2) : 2;
    return Math.min(4, Math.max(1, cores - 1));
  }

  private pump(): void {
    while (this.queue.length > 0) {
      const slot = this.acquireSlot();
      if (!slot) {
        return;
      }
      const task = this.queue.shift();
      if (!task) {
        return;
      }
      if (task.signal?.aborted) {
        this.settleReject(task, new ProcessingCancelledError());
        continue;
      }
      this.dispatch(slot, task);
    }
  }

  private acquireSlot(): PooledWorker | null {
    const idle = this.pool.find((slot) => slot.task === null);
    if (idle) {
      return idle;
    }
    if (this.pool.length >= this.concurrency) {
      return null;
    }
    const slot = this.createSlot();
    if (slot) {
      this.pool.push(slot);
    }
    return slot;
  }

  private createSlot(): PooledWorker | null {
    try {
      const worker = new Worker(new URL('../workers/image-processor.worker', import.meta.url), {
        type: 'module',
      });
      const slot: PooledWorker = { worker, task: null };

      worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
        this.handleResponse(slot, event.data);
      });

      worker.addEventListener('error', (event: ErrorEvent) => {
        this.handleWorkerCrash(slot, event.message || 'The image worker stopped unexpectedly.');
      });

      return slot;
    } catch {
      // Blocked by a restrictive CSP, or workers are unavailable — fall back.
      this.workersUsable = false;
      return null;
    }
  }

  private dispatch(slot: PooledWorker, task: PendingTask): void {
    slot.task = task;
    const request: WorkerRequest = { id: task.id, file: task.file, options: task.options };
    try {
      slot.worker.postMessage(request);
    } catch (error) {
      slot.task = null;
      this.settleReject(
        task,
        error instanceof Error ? error : new Error('This image could not be sent for processing.'),
      );
      this.pump();
    }
  }

  private handleResponse(slot: PooledWorker, response: WorkerResponse): void {
    const task = slot.task;
    if (!task || task.id !== response.id) {
      // Stale message from a worker whose task was already aborted.
      return;
    }
    slot.task = null;

    if (response.ok) {
      this.settleResolve(task, {
        blob: response.blob,
        type: response.type,
        width: response.width,
        height: response.height,
      });
    } else {
      this.settleReject(task, new Error(response.error));
    }

    this.pump();
  }

  private handleWorkerCrash(slot: PooledWorker, message: string): void {
    const task = slot.task;
    slot.task = null;
    this.removeSlot(slot);

    if (task) {
      this.settleReject(task, new Error(message));
    }
    this.pump();
  }

  /**
   * Cancels a task. A worker cannot be interrupted mid-encode, so a running task
   * is cancelled by terminating its worker; the pool simply grows a new one.
   */
  private abortTask(id: string): void {
    const queuedIndex = this.queue.findIndex((task) => task.id === id);
    if (queuedIndex > -1) {
      const [task] = this.queue.splice(queuedIndex, 1);
      this.settleReject(task, new ProcessingCancelledError());
      return;
    }

    const slot = this.pool.find((candidate) => candidate.task?.id === id);
    if (!slot) {
      return;
    }
    const task = slot.task;
    slot.task = null;
    slot.worker.terminate();
    this.removeSlot(slot);

    if (task) {
      this.settleReject(task, new ProcessingCancelledError());
    }
    this.pump();
  }

  private removeSlot(slot: PooledWorker): void {
    const index = this.pool.indexOf(slot);
    if (index > -1) {
      this.pool.splice(index, 1);
    }
  }

  private settleResolve(task: PendingTask, output: ProcessOutput): void {
    this.detachAbort(task);
    task.resolve(output);
  }

  private settleReject(task: PendingTask, error: Error): void {
    this.detachAbort(task);
    task.reject(error);
  }

  private detachAbort(task: PendingTask): void {
    if (task.signal && task.onAbort) {
      task.signal.removeEventListener('abort', task.onAbort);
    }
  }

  /** Used when workers or `OffscreenCanvas` are unavailable (older Safari, strict CSP). */
  private async processOnMainThread(
    file: Blob,
    options: ProcessOptions,
    signal?: AbortSignal,
  ): Promise<ProcessOutput> {
    if (!canProcessImages()) {
      throw new Error('This browser does not support the canvas features these tools need.');
    }

    // Yield first so the UI can paint the "processing" state before we block.
    await nextFrame();
    if (signal?.aborted) {
      throw new ProcessingCancelledError();
    }

    const output = await processImage(file, options);
    if (signal?.aborted) {
      throw new ProcessingCancelledError();
    }
    return output;
  }
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}
