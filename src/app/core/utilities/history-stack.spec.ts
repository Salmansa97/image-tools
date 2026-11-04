import { describe, expect, it } from 'vitest';

import { HistoryStack } from './history-stack';

interface Settings {
  brightness: number;
  contrast: number;
}

const start: Settings = { brightness: 100, contrast: 100 };

describe('HistoryStack', () => {
  it('starts with nothing to undo or redo', () => {
    const stack = new HistoryStack<Settings>(start);
    expect(stack.value()).toEqual(start);
    expect(stack.canUndo()).toBe(false);
    expect(stack.canRedo()).toBe(false);
  });

  it('records a committed change as one undo step', () => {
    const stack = new HistoryStack<Settings>(start);
    stack.commit({ brightness: 120, contrast: 100 });

    expect(stack.canUndo()).toBe(true);
    expect(stack.depth()).toBe(1);

    stack.undo();
    expect(stack.value()).toEqual(start);
    expect(stack.canRedo()).toBe(true);
  });

  it('does not record live edits made with set()', () => {
    const stack = new HistoryStack<Settings>(start);
    // A slider being dragged: many updates, no undo steps.
    stack.set({ brightness: 101, contrast: 100 });
    stack.set({ brightness: 102, contrast: 100 });
    stack.set({ brightness: 103, contrast: 100 });

    expect(stack.canUndo()).toBe(false);
    expect(stack.value().brightness).toBe(103);
  });

  it('collapses a whole drag into a single undo step', () => {
    const stack = new HistoryStack<Settings>(start);
    stack.set({ brightness: 110, contrast: 100 });
    stack.set({ brightness: 130, contrast: 100 });
    // On release: rewind to the pre-drag value, then commit the final one.
    stack.set(start);
    stack.commit({ brightness: 130, contrast: 100 });

    expect(stack.depth()).toBe(1);
    stack.undo();
    expect(stack.value()).toEqual(start);
  });

  it('redoes what was undone', () => {
    const stack = new HistoryStack<Settings>(start);
    stack.commit({ brightness: 120, contrast: 100 });
    stack.undo();
    stack.redo();

    expect(stack.value()).toEqual({ brightness: 120, contrast: 100 });
    expect(stack.canRedo()).toBe(false);
  });

  it('discards the redo branch once a new change is committed', () => {
    const stack = new HistoryStack<Settings>(start);
    stack.commit({ brightness: 120, contrast: 100 });
    stack.undo();
    expect(stack.canRedo()).toBe(true);

    stack.commit({ brightness: 90, contrast: 100 });
    expect(stack.canRedo()).toBe(false);
    expect(stack.value().brightness).toBe(90);
  });

  it('ignores a commit that changes nothing', () => {
    const stack = new HistoryStack<Settings>(start);
    stack.commit({ ...start });
    expect(stack.canUndo()).toBe(false);
  });

  it('walks back through several steps in order', () => {
    const stack = new HistoryStack<Settings>(start);
    stack.commit({ brightness: 110, contrast: 100 });
    stack.commit({ brightness: 120, contrast: 100 });
    stack.commit({ brightness: 130, contrast: 100 });

    stack.undo();
    expect(stack.value().brightness).toBe(120);
    stack.undo();
    expect(stack.value().brightness).toBe(110);
    stack.undo();
    expect(stack.value().brightness).toBe(100);
    expect(stack.canUndo()).toBe(false);
  });

  it('caps the history at its limit', () => {
    const stack = new HistoryStack<Settings>(start, 3);
    for (let i = 1; i <= 10; i += 1) {
      stack.commit({ brightness: 100 + i, contrast: 100 });
    }
    expect(stack.depth()).toBe(3);
  });

  it('undoing at the start and redoing at the end are no-ops', () => {
    const stack = new HistoryStack<Settings>(start);
    stack.undo();
    stack.redo();
    expect(stack.value()).toEqual(start);
  });

  it('reset clears both directions', () => {
    const stack = new HistoryStack<Settings>(start);
    stack.commit({ brightness: 120, contrast: 100 });
    stack.undo();
    stack.reset(start);

    expect(stack.canUndo()).toBe(false);
    expect(stack.canRedo()).toBe(false);
    expect(stack.value()).toEqual(start);
  });
});
