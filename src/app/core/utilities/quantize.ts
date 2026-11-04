/**
 * Median-cut colour quantisation.
 *
 * PNG is a lossless format, so canvas encoders ignore the quality argument
 * completely — asking for "70% quality PNG" returns a byte-identical file.
 * Reducing the number of distinct colours is the one lever that genuinely
 * shrinks a PNG in the browser, because DEFLATE then has far more repetition
 * to exploit. This runs in-place over RGBA pixel data.
 *
 * Colours are bucketed into a 5-bit-per-channel histogram (32,768 cells) first,
 * which keeps the cut O(cells) instead of O(pixels) and makes the final lookup
 * a single array index per pixel.
 */

const BITS = 5;
const SHIFT = 8 - BITS;
const SIDE = 1 << BITS; // 32
const CELLS = SIDE * SIDE * SIDE; // 32,768

interface Box {
  /** Indices into the histogram of the cells this box owns. */
  cells: Int32Array;
  /** Total number of source pixels represented. */
  count: number;
  rMin: number;
  rMax: number;
  gMin: number;
  gMax: number;
  bMin: number;
  bMax: number;
}

/**
 * Reduces `data` to at most `maxColors` distinct colours, in place.
 *
 * Fully transparent pixels are flattened to black: their RGB is invisible, and
 * collapsing them to a single value compresses dramatically better.
 */
export function quantize(data: Uint8ClampedArray, maxColors: number): void {
  const pixelCount = data.length >>> 2;
  if (pixelCount === 0 || maxColors >= 256) {
    return;
  }

  const counts = new Uint32Array(CELLS);
  const sumR = new Float64Array(CELLS);
  const sumG = new Float64Array(CELLS);
  const sumB = new Float64Array(CELLS);

  let occupied = 0;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      continue;
    }
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const cell = ((r >> SHIFT) << (BITS * 2)) | ((g >> SHIFT) << BITS) | (b >> SHIFT);
    if (counts[cell] === 0) {
      occupied += 1;
    }
    counts[cell] += 1;
    sumR[cell] += r;
    sumG[cell] += g;
    sumB[cell] += b;
  }

  // Nothing to gain if the image already uses fewer colours than the target.
  if (occupied === 0 || occupied <= maxColors) {
    return;
  }

  const cellList = new Int32Array(occupied);
  let cursor = 0;
  let totalPixels = 0;
  for (let cell = 0; cell < CELLS; cell += 1) {
    if (counts[cell] !== 0) {
      cellList[cursor] = cell;
      cursor += 1;
      totalPixels += counts[cell];
    }
  }

  const boxes = medianCut(cellList, counts, totalPixels, maxColors);

  // Map every occupied cell to the averaged colour of the box that owns it.
  const lookupR = new Uint8Array(CELLS);
  const lookupG = new Uint8Array(CELLS);
  const lookupB = new Uint8Array(CELLS);

  for (const box of boxes) {
    let weight = 0;
    let accR = 0;
    let accG = 0;
    let accB = 0;

    for (const cell of box.cells) {
      weight += counts[cell];
      accR += sumR[cell];
      accG += sumG[cell];
      accB += sumB[cell];
    }

    const r = weight === 0 ? 0 : Math.round(accR / weight);
    const g = weight === 0 ? 0 : Math.round(accG / weight);
    const b = weight === 0 ? 0 : Math.round(accB / weight);

    for (const cell of box.cells) {
      lookupR[cell] = r;
      lookupG[cell] = g;
      lookupB[cell] = b;
    }
  }

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) {
      continue;
    }
    const cell =
      ((data[i] >> SHIFT) << (BITS * 2)) |
      ((data[i + 1] >> SHIFT) << BITS) |
      (data[i + 2] >> SHIFT);
    data[i] = lookupR[cell];
    data[i + 1] = lookupG[cell];
    data[i + 2] = lookupB[cell];
  }
}

function medianCut(
  cellList: Int32Array,
  counts: Uint32Array,
  totalPixels: number,
  maxColors: number,
): Box[] {
  const boxes: Box[] = [createBox(cellList, totalPixels)];

  while (boxes.length < maxColors) {
    const index = pickBoxToSplit(boxes);
    if (index === -1) {
      break;
    }
    const halves = splitBox(boxes[index], counts);
    if (!halves) {
      break;
    }
    boxes.splice(index, 1, halves[0], halves[1]);
  }

  return boxes;
}

function createBox(cells: Int32Array, count: number): Box {
  let rMin = SIDE;
  let rMax = -1;
  let gMin = SIDE;
  let gMax = -1;
  let bMin = SIDE;
  let bMax = -1;

  for (const cell of cells) {
    const r = (cell >> (BITS * 2)) & (SIDE - 1);
    const g = (cell >> BITS) & (SIDE - 1);
    const b = cell & (SIDE - 1);
    if (r < rMin) rMin = r;
    if (r > rMax) rMax = r;
    if (g < gMin) gMin = g;
    if (g > gMax) gMax = g;
    if (b < bMin) bMin = b;
    if (b > bMax) bMax = b;
  }

  return { cells, count, rMin, rMax, gMin, gMax, bMin, bMax };
}

function isSplittable(box: Box): boolean {
  return box.cells.length > 1;
}

/**
 * Picks the box that will lose the most colour fidelity if left alone:
 * pixel count weighted by the longest edge of its colour range.
 */
function pickBoxToSplit(boxes: Box[]): number {
  let best = -1;
  let bestScore = 0;

  for (let i = 0; i < boxes.length; i += 1) {
    const box = boxes[i];
    if (!isSplittable(box)) {
      continue;
    }
    const extent = Math.max(box.rMax - box.rMin, box.gMax - box.gMin, box.bMax - box.bMin);
    const score = box.count * (extent + 1);
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }

  return best;
}

function splitBox(box: Box, counts: Uint32Array): [Box, Box] | null {
  const rRange = box.rMax - box.rMin;
  const gRange = box.gMax - box.gMin;
  const bRange = box.bMax - box.bMin;

  let shift: number;
  if (rRange >= gRange && rRange >= bRange) {
    shift = BITS * 2;
  } else if (gRange >= bRange) {
    shift = BITS;
  } else {
    shift = 0;
  }

  const sorted = Int32Array.from(box.cells).sort((a, b) => {
    const channelA = (a >> shift) & (SIDE - 1);
    const channelB = (b >> shift) & (SIDE - 1);
    return channelA - channelB;
  });

  // Cut where the cumulative pixel count crosses half the box, so both halves
  // carry a similar share of the image rather than a similar share of cells.
  const half = box.count / 2;
  let running = 0;
  let splitAt = 0;
  for (let i = 0; i < sorted.length - 1; i += 1) {
    running += counts[sorted[i]];
    if (running >= half) {
      splitAt = i + 1;
      break;
    }
  }
  if (splitAt <= 0 || splitAt >= sorted.length) {
    splitAt = sorted.length >> 1;
  }
  if (splitAt <= 0 || splitAt >= sorted.length) {
    return null;
  }

  const leftCells = sorted.slice(0, splitAt);
  const rightCells = sorted.slice(splitAt);

  return [
    createBox(leftCells, sumCounts(leftCells, counts)),
    createBox(rightCells, sumCounts(rightCells, counts)),
  ];
}

function sumCounts(cells: Int32Array, counts: Uint32Array): number {
  let total = 0;
  for (const cell of cells) {
    total += counts[cell];
  }
  return total;
}
