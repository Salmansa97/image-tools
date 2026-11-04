import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

export interface HistoryRecord {
  readonly id: string;
  /** Tool id from the catalogue, e.g. `compress`. */
  readonly toolId: string;
  readonly toolName: string;
  readonly toolPath: string;
  readonly fileName: string;
  readonly sourceSize: number;
  readonly resultSize: number;
  readonly sourceType: string;
  readonly resultType: string;
  readonly width: number;
  readonly height: number;
  /** Epoch milliseconds. */
  readonly at: number;
  /** Short human summary of the settings used, e.g. "Quality 75%". */
  readonly summary: string;
}

const DB_NAME = 'imagetools';
const DB_VERSION = 1;
const STORE = 'history';
const MAX_RECORDS = 200;

/**
 * A local log of what you have processed.
 *
 * Deliberately stores **only** names, sizes and settings — never image data, and
 * never anything that leaves the device. IndexedDB is used rather than
 * localStorage because this is structured data that grows, and because a quota
 * failure there degrades gracefully instead of throwing on every write.
 *
 * Everything is written behind a feature check, so the tools work normally in
 * private-browsing modes where IndexedDB is unavailable.
 */
@Injectable({ providedIn: 'root' })
export class ProcessingHistoryService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly recordsState = signal<readonly HistoryRecord[]>([]);
  private readonly loadedState = signal(false);
  private readonly availableState = signal(true);

  readonly records = this.recordsState.asReadonly();
  readonly loaded = this.loadedState.asReadonly();
  readonly available = this.availableState.asReadonly();
  readonly count = computed(() => this.recordsState().length);

  readonly totalSaved = computed(() =>
    this.recordsState().reduce(
      (total, record) => total + Math.max(0, record.sourceSize - record.resultSize),
      0,
    ),
  );

  private db: IDBDatabase | null = null;
  private opening: Promise<IDBDatabase | null> | null = null;

  /** Loads the log. Safe to call repeatedly; only the first call does work. */
  async load(): Promise<void> {
    if (this.loadedState() || !this.isBrowser) {
      return;
    }

    const db = await this.open();
    if (!db) {
      this.loadedState.set(true);
      return;
    }

    try {
      const all = await request<HistoryRecord[]>(
        db.transaction(STORE, 'readonly').objectStore(STORE).getAll(),
      );
      this.recordsState.set([...all].sort((a, b) => b.at - a.at).slice(0, MAX_RECORDS));
    } catch {
      this.availableState.set(false);
    } finally {
      this.loadedState.set(true);
    }
  }

  /** Appends a record. Failures are swallowed: history is a convenience, not a feature to block on. */
  async record(entry: Omit<HistoryRecord, 'id' | 'at'>): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    const record: HistoryRecord = {
      ...entry,
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      at: Date.now(),
    };

    this.recordsState.update((records) => [record, ...records].slice(0, MAX_RECORDS));

    const db = await this.open();
    if (!db) {
      return;
    }

    try {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(record);
      await transaction(tx);
      await this.prune(db);
    } catch {
      this.availableState.set(false);
    }
  }

  async remove(id: string): Promise<void> {
    this.recordsState.update((records) => records.filter((record) => record.id !== id));

    const db = await this.open();
    if (!db) {
      return;
    }
    try {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      await transaction(tx);
    } catch {
      /* already gone */
    }
  }

  async clear(): Promise<void> {
    this.recordsState.set([]);

    const db = await this.open();
    if (!db) {
      return;
    }
    try {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      await transaction(tx);
    } catch {
      /* nothing to clear */
    }
  }

  /** Drops the oldest entries once the log passes its cap. */
  private async prune(db: IDBDatabase): Promise<void> {
    const kept = new Set(this.recordsState().map((record) => record.id));
    try {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const keys = await request<IDBValidKey[]>(store.getAllKeys());
      for (const key of keys) {
        if (!kept.has(String(key))) {
          store.delete(key);
        }
      }
      await transaction(tx);
    } catch {
      /* pruning is best-effort */
    }
  }

  private open(): Promise<IDBDatabase | null> {
    if (this.db) {
      return Promise.resolve(this.db);
    }
    if (this.opening) {
      return this.opening;
    }
    if (!this.isBrowser || typeof indexedDB === 'undefined') {
      this.availableState.set(false);
      return Promise.resolve(null);
    }

    this.opening = new Promise<IDBDatabase | null>((resolve) => {
      let settled = false;
      const finish = (value: IDBDatabase | null) => {
        if (!settled) {
          settled = true;
          resolve(value);
        }
      };

      try {
        const open = indexedDB.open(DB_NAME, DB_VERSION);

        open.onupgradeneeded = () => {
          const db = open.result;
          if (!db.objectStoreNames.contains(STORE)) {
            const store = db.createObjectStore(STORE, { keyPath: 'id' });
            store.createIndex('at', 'at');
          }
        };

        open.onsuccess = () => {
          this.db = open.result;
          finish(open.result);
        };

        open.onerror = () => {
          this.availableState.set(false);
          finish(null);
        };

        // Firefox in permanent private mode never fires either handler.
        open.onblocked = () => {
          this.availableState.set(false);
          finish(null);
        };
      } catch {
        this.availableState.set(false);
        finish(null);
      }
    });

    return this.opening;
  }
}

function request<T>(req: IDBRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

function transaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
