import { Signal, computed, signal } from '@angular/core';

/**
 * Signal-backed undo/redo over a value.
 *
 * Used by the editing tools (filters, watermark, rotate/flip) where a user
 * experiments and wants to step back. It stores snapshots of small plain
 * settings objects, never image data, so the depth cap exists only to keep the
 * UI sensible rather than to save memory.
 *
 * `commit` is deliberately separate from live editing: dragging a slider should
 * produce one undo step when released, not sixty while moving.
 */
export class HistoryStack<T> {
  private readonly past = signal<readonly T[]>([]);
  private readonly future = signal<readonly T[]>([]);
  private readonly current: ReturnType<typeof signal<T>>;

  readonly value: Signal<T>;
  readonly canUndo = computed(() => this.past().length > 0);
  readonly canRedo = computed(() => this.future().length > 0);
  readonly depth = computed(() => this.past().length);

  constructor(
    initial: T,
    private readonly limit = 40,
    private readonly equals: (a: T, b: T) => boolean = defaultEquals,
  ) {
    this.current = signal<T>(initial);
    this.value = this.current.asReadonly();
  }

  /** Replaces the value without recording a step — for live, in-progress edits. */
  set(value: T): void {
    this.current.set(value);
  }

  update(mutate: (value: T) => T): void {
    this.current.set(mutate(this.current()));
  }

  /**
   * Records the current value as an undo point and moves to `next`.
   * A no-op when nothing actually changed, so repeated commits stay clean.
   */
  commit(next: T): void {
    const previous = this.current();
    if (this.equals(previous, next)) {
      this.current.set(next);
      return;
    }

    this.past.update((entries) => {
      const appended = [...entries, previous];
      return appended.length > this.limit ? appended.slice(appended.length - this.limit) : appended;
    });
    this.future.set([]);
    this.current.set(next);
  }

  undo(): void {
    const past = this.past();
    if (past.length === 0) {
      return;
    }
    const previous = past[past.length - 1];
    this.past.set(past.slice(0, -1));
    this.future.update((entries) => [this.current(), ...entries]);
    this.current.set(previous);
  }

  redo(): void {
    const future = this.future();
    if (future.length === 0) {
      return;
    }
    const [next, ...rest] = future;
    this.future.set(rest);
    this.past.update((entries) => [...entries, this.current()]);
    this.current.set(next);
  }

  /** Clears the history and starts again from `value`. */
  reset(value: T): void {
    this.past.set([]);
    this.future.set([]);
    this.current.set(value);
  }
}

function defaultEquals<T>(a: T, b: T): boolean {
  if (a === b) {
    return true;
  }
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }
  return JSON.stringify(a) === JSON.stringify(b);
}
