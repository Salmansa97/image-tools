/**
 * Runs an async task over a list with a fixed number of tasks in flight.
 *
 * The worker pool already limits how many images are decoded at once, but driving
 * the batch from here keeps each item's reported status accurate: an image only
 * flips to "processing" when a slot actually picks it up, not the moment the
 * batch starts.
 */
export async function runWithConcurrency<T>(
  items: readonly T[],
  limit: number,
  task: (item: T, index: number) => Promise<void>,
  signal?: AbortSignal,
): Promise<void> {
  const size = items.length;
  if (size === 0) {
    return;
  }

  const workers = Math.max(1, Math.min(limit, size));
  let cursor = 0;

  const runner = async (): Promise<void> => {
    while (true) {
      if (signal?.aborted) {
        return;
      }
      const index = cursor;
      cursor += 1;
      if (index >= size) {
        return;
      }
      await task(items[index], index);
    }
  };

  await Promise.all(Array.from({ length: workers }, () => runner()));
}
