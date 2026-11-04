/**
 * Image metadata reader.
 *
 * Parses the container itself rather than relying on a library: JPEG APP
 * segments (including a full EXIF/TIFF IFD walk), PNG chunks, and WebP RIFF
 * chunks. Everything happens on bytes already in memory, so no image is ever
 * sent anywhere to be inspected.
 *
 * GPS coordinates are surfaced prominently because most people have no idea
 * their photographs carry them.
 */

export interface MetadataEntry {
  readonly label: string;
  readonly value: string;
}

export interface MetadataGroup {
  readonly name: string;
  readonly entries: readonly MetadataEntry[];
}

export interface GpsPosition {
  readonly latitude: number;
  readonly longitude: number;
  readonly altitude?: number;
}

export interface ImageMetadata {
  readonly fileName: string;
  readonly fileSize: number;
  /** Detected from the bytes, not the extension. */
  readonly format: string;
  readonly width: number;
  readonly height: number;
  readonly groups: readonly MetadataGroup[];
  readonly hasExif: boolean;
  readonly hasXmp: boolean;
  readonly hasIcc: boolean;
  readonly gps: GpsPosition | null;
  /** Bytes of metadata that a re-encode would discard. */
  readonly metadataBytes: number;
  readonly notes: readonly string[];
}

/* -------------------------------------------------------------------------- */

export async function readMetadata(file: File): Promise<ImageMetadata> {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    return readJpeg(file, view, bytes);
  }
  if (bytes[0] === 0x89 && bytes[1] === 0x50) {
    return readPng(file, view, bytes);
  }
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') {
    return readWebp(file, view, bytes);
  }

  return empty(file, 'Unknown', ['This file format is not one ImageTools can inspect.']);
}

function empty(file: File, format: string, notes: string[] = []): ImageMetadata {
  return {
    fileName: file.name,
    fileSize: file.size,
    format,
    width: 0,
    height: 0,
    groups: [],
    hasExif: false,
    hasXmp: false,
    hasIcc: false,
    gps: null,
    metadataBytes: 0,
    notes,
  };
}

/* -------------------------------------------------------------------------- */
/* JPEG                                                                       */
/* -------------------------------------------------------------------------- */

function readJpeg(file: File, view: DataView, bytes: Uint8Array): ImageMetadata {
  const groups: MetadataGroup[] = [];
  const notes: string[] = [];
  let width = 0;
  let height = 0;
  let hasExif = false;
  let hasXmp = false;
  let hasIcc = false;
  let gps: GpsPosition | null = null;
  let metadataBytes = 0;
  let progressive = false;
  let comment: string | null = null;
  let exifGroups: MetadataGroup[] = [];

  let offset = 2;
  while (offset < bytes.length - 1) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];

    // Standalone markers carry no length.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    // Start of scan: entropy-coded data follows, nothing more to read.
    if (marker === 0xda || marker === 0xd9) {
      break;
    }

    const length = view.getUint16(offset + 2, false);
    const segmentStart = offset + 4;
    const segmentLength = length - 2;

    // SOF0/1 baseline, SOF2 progressive; others are rarely seen.
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      progressive = marker === 0xc2;
      height = view.getUint16(segmentStart + 1, false);
      width = view.getUint16(segmentStart + 3, false);
    } else if (marker === 0xe1) {
      const header = ascii(bytes, segmentStart, 6);
      if (header === 'Exif\0\0') {
        hasExif = true;
        metadataBytes += length;
        const parsed = parseExif(view, segmentStart + 6, segmentLength - 6);
        exifGroups = parsed.groups;
        gps = parsed.gps ?? gps;
      } else if (ascii(bytes, segmentStart, 28).startsWith('http://ns.adobe.com/xap')) {
        hasXmp = true;
        metadataBytes += length;
      }
    } else if (marker === 0xe2 && ascii(bytes, segmentStart, 11) === 'ICC_PROFILE') {
      hasIcc = true;
      metadataBytes += length;
    } else if (marker === 0xed || marker === 0xee) {
      // Photoshop IRB / Adobe APP14.
      metadataBytes += length;
    } else if (marker === 0xfe) {
      comment = text(bytes, segmentStart, segmentLength).trim() || null;
      metadataBytes += length;
    }

    offset = segmentStart + segmentLength;
  }

  groups.push({
    name: 'Image',
    entries: compact([
      { label: 'Format', value: 'JPEG' },
      { label: 'Dimensions', value: width ? `${width} × ${height} px` : '—' },
      {
        label: 'Megapixels',
        value: width ? `${((width * height) / 1_000_000).toFixed(1)} MP` : '—',
      },
      { label: 'Encoding', value: progressive ? 'Progressive' : 'Baseline' },
      comment ? { label: 'Comment', value: comment } : null,
    ]),
  });

  groups.push(...exifGroups);

  if (!hasExif) {
    notes.push('This JPEG contains no EXIF data — it has probably already been stripped.');
  }
  if (gps) {
    notes.push('This photograph records the exact location where it was taken.');
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    format: 'JPEG',
    width,
    height,
    groups,
    hasExif,
    hasXmp,
    hasIcc,
    gps,
    metadataBytes,
    notes,
  };
}

/* -------------------------------------------------------------------------- */
/* EXIF / TIFF                                                                */
/* -------------------------------------------------------------------------- */

const IFD0_TAGS: Record<number, string> = {
  0x010f: 'Camera make',
  0x0110: 'Camera model',
  0x0112: 'Orientation',
  0x011a: 'X resolution',
  0x011b: 'Y resolution',
  0x0128: 'Resolution unit',
  0x0131: 'Software',
  0x0132: 'Date modified',
  0x013b: 'Artist',
  0x8298: 'Copyright',
  0x010e: 'Description',
};

const EXIF_TAGS: Record<number, string> = {
  0x829a: 'Exposure time',
  0x829d: 'F number',
  0x8822: 'Exposure program',
  0x8827: 'ISO',
  0x9003: 'Date taken',
  0x9004: 'Date digitised',
  0x9201: 'Shutter speed',
  0x9202: 'Aperture',
  0x9204: 'Exposure bias',
  0x9207: 'Metering mode',
  0x9209: 'Flash',
  0x920a: 'Focal length',
  0xa001: 'Colour space',
  0xa002: 'Pixel width',
  0xa003: 'Pixel height',
  0xa402: 'Exposure mode',
  0xa403: 'White balance',
  0xa406: 'Scene type',
  0xa432: 'Lens specification',
  0xa433: 'Lens make',
  0xa434: 'Lens model',
};

const GPS_TAGS: Record<number, string> = {
  0x0001: 'Latitude ref',
  0x0002: 'Latitude',
  0x0003: 'Longitude ref',
  0x0004: 'Longitude',
  0x0005: 'Altitude ref',
  0x0006: 'Altitude',
  0x0007: 'Timestamp',
  0x001d: 'Date',
};

const ORIENTATION: Record<number, string> = {
  1: 'Normal',
  2: 'Mirrored horizontally',
  3: 'Rotated 180°',
  4: 'Mirrored vertically',
  5: 'Mirrored and rotated 90° CCW',
  6: 'Rotated 90° CW',
  7: 'Mirrored and rotated 90° CW',
  8: 'Rotated 90° CCW',
};

const METERING: Record<number, string> = {
  0: 'Unknown',
  1: 'Average',
  2: 'Centre-weighted',
  3: 'Spot',
  4: 'Multi-spot',
  5: 'Pattern',
  6: 'Partial',
};

const EXPOSURE_PROGRAM: Record<number, string> = {
  0: 'Not defined',
  1: 'Manual',
  2: 'Normal program',
  3: 'Aperture priority',
  4: 'Shutter priority',
  5: 'Creative',
  6: 'Action',
  7: 'Portrait',
  8: 'Landscape',
};

interface RawTag {
  readonly tag: number;
  readonly value: number | number[] | string;
}

function parseExif(
  view: DataView,
  start: number,
  length: number,
): { groups: MetadataGroup[]; gps: GpsPosition | null } {
  const groups: MetadataGroup[] = [];

  if (start + 8 > view.byteLength) {
    return { groups, gps: null };
  }

  const byteOrder = view.getUint16(start, false);
  // 'II' = little-endian, 'MM' = big-endian.
  const little = byteOrder === 0x4949;
  if (!little && byteOrder !== 0x4d4d) {
    return { groups, gps: null };
  }
  if (view.getUint16(start + 2, little) !== 42) {
    return { groups, gps: null };
  }

  const limit = Math.min(view.byteLength, start + length);
  const ifd0Offset = view.getUint32(start + 4, little);
  const ifd0 = readIfd(view, start, start + ifd0Offset, little, limit);

  const cameraEntries: MetadataEntry[] = [];
  let exifPointer = 0;
  let gpsPointer = 0;

  for (const raw of ifd0) {
    if (raw.tag === 0x8769) {
      exifPointer = Number(raw.value);
      continue;
    }
    if (raw.tag === 0x8825) {
      gpsPointer = Number(raw.value);
      continue;
    }
    const label = IFD0_TAGS[raw.tag];
    if (label) {
      cameraEntries.push({ label, value: formatIfd0(raw) });
    }
  }

  if (cameraEntries.length > 0) {
    groups.push({ name: 'Camera', entries: cameraEntries });
  }

  if (exifPointer > 0) {
    const exif = readIfd(view, start, start + exifPointer, little, limit);
    const entries: MetadataEntry[] = [];
    for (const raw of exif) {
      const label = EXIF_TAGS[raw.tag];
      if (label) {
        entries.push({ label, value: formatExif(raw) });
      }
    }
    if (entries.length > 0) {
      groups.push({ name: 'Capture settings', entries });
    }
  }

  let gps: GpsPosition | null = null;

  if (gpsPointer > 0) {
    const gpsIfd = readIfd(view, start, start + gpsPointer, little, limit);
    const byTag = new Map<number, RawTag>(gpsIfd.map((raw) => [raw.tag, raw]));
    const entries: MetadataEntry[] = [];

    for (const raw of gpsIfd) {
      const label = GPS_TAGS[raw.tag];
      if (label) {
        entries.push({ label, value: formatGps(raw) });
      }
    }

    const latitude = coordinate(byTag.get(0x0002), byTag.get(0x0001));
    const longitude = coordinate(byTag.get(0x0004), byTag.get(0x0003));
    if (latitude !== null && longitude !== null) {
      const altitudeTag = byTag.get(0x0006);
      const altitude = altitudeTag ? Number(altitudeTag.value) : undefined;
      gps = {
        latitude,
        longitude,
        altitude: Number.isFinite(altitude) ? altitude : undefined,
      };
      entries.unshift({
        label: 'Coordinates',
        value: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      });
    }

    if (entries.length > 0) {
      groups.push({ name: 'Location', entries });
    }
  }

  return { groups, gps };
}

function readIfd(
  view: DataView,
  tiffStart: number,
  ifdStart: number,
  little: boolean,
  limit: number,
): RawTag[] {
  const out: RawTag[] = [];
  if (ifdStart + 2 > limit) {
    return out;
  }

  const count = view.getUint16(ifdStart, little);
  // A corrupt pointer can claim tens of thousands of entries; cap it.
  const entries = Math.min(count, 256);

  for (let i = 0; i < entries; i += 1) {
    const entry = ifdStart + 2 + i * 12;
    if (entry + 12 > limit) {
      break;
    }
    const tag = view.getUint16(entry, little);
    const type = view.getUint16(entry + 2, little);
    const valueCount = view.getUint32(entry + 4, little);
    const size = TYPE_SIZE[type] ?? 0;
    if (size === 0 || valueCount > 4096) {
      continue;
    }

    const totalBytes = size * valueCount;
    const valueOffset = totalBytes <= 4 ? entry + 8 : tiffStart + view.getUint32(entry + 8, little);

    if (valueOffset < 0 || valueOffset + totalBytes > limit) {
      continue;
    }

    const value = readValue(view, valueOffset, type, valueCount, little);
    if (value !== null) {
      out.push({ tag, value });
    }
  }

  return out;
}

const TYPE_SIZE: Record<number, number> = {
  1: 1, // BYTE
  2: 1, // ASCII
  3: 2, // SHORT
  4: 4, // LONG
  5: 8, // RATIONAL
  6: 1, // SBYTE
  7: 1, // UNDEFINED
  8: 2, // SSHORT
  9: 4, // SLONG
  10: 8, // SRATIONAL
  11: 4, // FLOAT
  12: 8, // DOUBLE
};

function readValue(
  view: DataView,
  offset: number,
  type: number,
  count: number,
  little: boolean,
): number | number[] | string | null {
  switch (type) {
    case 2: {
      let out = '';
      for (let i = 0; i < count; i += 1) {
        const code = view.getUint8(offset + i);
        if (code === 0) {
          break;
        }
        out += String.fromCharCode(code);
      }
      return out.trim();
    }
    case 1:
    case 7:
      return count === 1 ? view.getUint8(offset) : collect(count, (i) => view.getUint8(offset + i));
    case 3:
      return count === 1
        ? view.getUint16(offset, little)
        : collect(count, (i) => view.getUint16(offset + i * 2, little));
    case 4:
      return count === 1
        ? view.getUint32(offset, little)
        : collect(count, (i) => view.getUint32(offset + i * 4, little));
    case 9:
      return count === 1
        ? view.getInt32(offset, little)
        : collect(count, (i) => view.getInt32(offset + i * 4, little));
    case 5:
    case 10: {
      const read = (i: number) => {
        const numerator =
          type === 5
            ? view.getUint32(offset + i * 8, little)
            : view.getInt32(offset + i * 8, little);
        const denominator =
          type === 5
            ? view.getUint32(offset + i * 8 + 4, little)
            : view.getInt32(offset + i * 8 + 4, little);
        return denominator === 0 ? 0 : numerator / denominator;
      };
      return count === 1 ? read(0) : collect(count, read);
    }
    default:
      return null;
  }
}

function collect(count: number, read: (index: number) => number): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(read(i));
  }
  return out;
}

function formatIfd0(raw: RawTag): string {
  if (raw.tag === 0x0112) {
    return ORIENTATION[Number(raw.value)] ?? String(raw.value);
  }
  if (raw.tag === 0x011a || raw.tag === 0x011b) {
    return `${round(Number(raw.value))} dpi`;
  }
  return String(raw.value);
}

function formatExif(raw: RawTag): string {
  const numeric = Number(raw.value);
  switch (raw.tag) {
    case 0x829a:
      return numeric > 0 && numeric < 1 ? `1/${Math.round(1 / numeric)} s` : `${round(numeric)} s`;
    case 0x829d:
    case 0x9202:
      return `ƒ/${round(numeric)}`;
    case 0x920a:
      return `${round(numeric)} mm`;
    case 0x8827:
      return `ISO ${Array.isArray(raw.value) ? raw.value[0] : numeric}`;
    case 0x9201:
      return numeric > 0 ? `1/${Math.round(2 ** numeric)} s` : `${round(numeric)} EV`;
    case 0x9204:
      return `${numeric > 0 ? '+' : ''}${round(numeric)} EV`;
    case 0x9207:
      return METERING[numeric] ?? String(numeric);
    case 0x8822:
      return EXPOSURE_PROGRAM[numeric] ?? String(numeric);
    case 0x9209:
      // Bit 0 of the Flash tag records whether it actually fired.
      return (numeric & 1) === 1 ? 'Fired' : 'Did not fire';
    case 0xa001:
      return numeric === 1 ? 'sRGB' : numeric === 65535 ? 'Uncalibrated' : String(numeric);
    case 0xa403:
      return numeric === 0 ? 'Auto' : 'Manual';
    case 0xa402:
      return numeric === 0 ? 'Auto' : numeric === 1 ? 'Manual' : 'Auto bracket';
    default:
      return Array.isArray(raw.value) ? raw.value.map(round).join(', ') : String(raw.value);
  }
}

function formatGps(raw: RawTag): string {
  if (Array.isArray(raw.value)) {
    if (raw.tag === 0x0002 || raw.tag === 0x0004) {
      const [d, m, s] = raw.value;
      return `${d ?? 0}° ${m ?? 0}′ ${round(s ?? 0)}″`;
    }
    if (raw.tag === 0x0007) {
      return raw.value.map((part) => String(Math.round(part)).padStart(2, '0')).join(':');
    }
    return raw.value.map(round).join(', ');
  }
  if (raw.tag === 0x0006) {
    return `${round(Number(raw.value))} m`;
  }
  if (raw.tag === 0x0005) {
    return Number(raw.value) === 1 ? 'Below sea level' : 'Above sea level';
  }
  return String(raw.value);
}

/** Converts a degrees/minutes/seconds triple plus its hemisphere into decimal. */
function coordinate(value: RawTag | undefined, ref: RawTag | undefined): number | null {
  if (!value || !Array.isArray(value.value) || value.value.length < 3) {
    return null;
  }
  const [degrees, minutes, seconds] = value.value;
  let decimal = degrees + minutes / 60 + seconds / 3600;
  const hemisphere = typeof ref?.value === 'string' ? ref.value.toUpperCase() : '';
  if (hemisphere === 'S' || hemisphere === 'W') {
    decimal = -decimal;
  }
  return Number.isFinite(decimal) ? decimal : null;
}

/* -------------------------------------------------------------------------- */
/* PNG                                                                        */
/* -------------------------------------------------------------------------- */

const PNG_COLOUR_TYPES: Record<number, string> = {
  0: 'Greyscale',
  2: 'Truecolour (RGB)',
  3: 'Indexed palette',
  4: 'Greyscale with alpha',
  6: 'Truecolour with alpha (RGBA)',
};

function readPng(file: File, view: DataView, bytes: Uint8Array): ImageMetadata {
  const groups: MetadataGroup[] = [];
  const notes: string[] = [];
  const textEntries: MetadataEntry[] = [];
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colourType = 0;
  let interlaced = false;
  let hasExif = false;
  let hasXmp = false;
  let hasIcc = false;
  let metadataBytes = 0;
  let gps: GpsPosition | null = null;
  let physical: string | null = null;
  let modified: string | null = null;
  let exifGroups: MetadataGroup[] = [];

  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const length = view.getUint32(offset, false);
    const type = ascii(bytes, offset + 4, 4);
    const dataStart = offset + 8;

    if (length > bytes.length) {
      break;
    }

    if (type === 'IHDR') {
      width = view.getUint32(dataStart, false);
      height = view.getUint32(dataStart + 4, false);
      bitDepth = bytes[dataStart + 8];
      colourType = bytes[dataStart + 9];
      interlaced = bytes[dataStart + 12] === 1;
    } else if (type === 'tEXt' || type === 'iTXt' || type === 'zTXt') {
      metadataBytes += length + 12;
      const entry = readPngText(bytes, dataStart, length, type);
      if (entry) {
        textEntries.push(entry);
      }
    } else if (type === 'eXIf') {
      hasExif = true;
      metadataBytes += length + 12;
      const parsed = parseExif(view, dataStart, length);
      exifGroups = parsed.groups;
      gps = parsed.gps;
    } else if (type === 'iCCP') {
      hasIcc = true;
      metadataBytes += length + 12;
    } else if (type === 'pHYs') {
      const ppuX = view.getUint32(dataStart, false);
      const unit = bytes[dataStart + 8];
      if (unit === 1) {
        physical = `${Math.round(ppuX * 0.0254)} dpi`;
      }
    } else if (type === 'tIME') {
      modified = `${view.getUint16(dataStart, false)}-${pad(bytes[dataStart + 2])}-${pad(
        bytes[dataStart + 3],
      )} ${pad(bytes[dataStart + 4])}:${pad(bytes[dataStart + 5])}:${pad(bytes[dataStart + 6])}`;
      metadataBytes += length + 12;
    } else if (type === 'IEND') {
      break;
    }

    offset = dataStart + length + 4;
  }

  if (textEntries.some((entry) => entry.label.toLowerCase().includes('xml'))) {
    hasXmp = true;
  }

  groups.push({
    name: 'Image',
    entries: compact([
      { label: 'Format', value: 'PNG' },
      { label: 'Dimensions', value: `${width} × ${height} px` },
      { label: 'Megapixels', value: `${((width * height) / 1_000_000).toFixed(1)} MP` },
      { label: 'Colour type', value: PNG_COLOUR_TYPES[colourType] ?? String(colourType) },
      { label: 'Bit depth', value: `${bitDepth}-bit per channel` },
      { label: 'Interlacing', value: interlaced ? 'Adam7' : 'None' },
      physical ? { label: 'Resolution', value: physical } : null,
      modified ? { label: 'Last modified', value: modified } : null,
    ]),
  });

  groups.push(...exifGroups);

  if (textEntries.length > 0) {
    groups.push({ name: 'Text chunks', entries: textEntries });
  }

  if (textEntries.length === 0 && !hasExif) {
    notes.push('This PNG carries no text or EXIF chunks.');
  }
  if (gps) {
    notes.push('This image records the exact location where it was taken.');
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    format: 'PNG',
    width,
    height,
    groups,
    hasExif,
    hasXmp,
    hasIcc,
    gps,
    metadataBytes,
    notes,
  };
}

function readPngText(
  bytes: Uint8Array,
  start: number,
  length: number,
  type: string,
): MetadataEntry | null {
  const end = start + length;
  let separator = start;
  while (separator < end && bytes[separator] !== 0) {
    separator += 1;
  }
  const keyword = text(bytes, start, separator - start);
  if (!keyword) {
    return null;
  }

  // Compressed payloads need inflating, which is not worth bundling for a viewer.
  if (type === 'zTXt') {
    return { label: keyword, value: '(compressed text)' };
  }
  if (type === 'iTXt') {
    const compressed = bytes[separator + 1] === 1;
    if (compressed) {
      return { label: keyword, value: '(compressed text)' };
    }
    // iTXt: keyword \0 flag method langTag \0 translatedKeyword \0 text
    let cursor = separator + 3;
    let nulls = 0;
    while (cursor < end && nulls < 2) {
      if (bytes[cursor] === 0) {
        nulls += 1;
      }
      cursor += 1;
    }
    return { label: keyword, value: truncate(text(bytes, cursor, end - cursor)) };
  }

  return { label: keyword, value: truncate(text(bytes, separator + 1, end - separator - 1)) };
}

/* -------------------------------------------------------------------------- */
/* WebP                                                                       */
/* -------------------------------------------------------------------------- */

function readWebp(file: File, view: DataView, bytes: Uint8Array): ImageMetadata {
  const groups: MetadataGroup[] = [];
  const notes: string[] = [];
  let width = 0;
  let height = 0;
  let hasExif = false;
  let hasXmp = false;
  let hasIcc = false;
  let hasAlpha = false;
  let animated = false;
  let variant = 'Lossy';
  let metadataBytes = 0;
  let gps: GpsPosition | null = null;
  let exifGroups: MetadataGroup[] = [];

  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const chunk = ascii(bytes, offset, 4);
    const length = view.getUint32(offset + 4, true);
    const dataStart = offset + 8;

    if (length > bytes.length) {
      break;
    }

    if (chunk === 'VP8X') {
      const flags = bytes[dataStart];
      hasIcc = (flags & 0b0010_0000) !== 0;
      hasAlpha = (flags & 0b0001_0000) !== 0;
      animated = (flags & 0b0000_0010) !== 0;
      // 24-bit little-endian, minus one.
      width = readUint24(bytes, dataStart + 4) + 1;
      height = readUint24(bytes, dataStart + 7) + 1;
    } else if (chunk === 'VP8 ' && width === 0) {
      // Lossy bitstream: dimensions live after the 3-byte start code.
      width = view.getUint16(dataStart + 6, true) & 0x3fff;
      height = view.getUint16(dataStart + 8, true) & 0x3fff;
    } else if (chunk === 'VP8L') {
      variant = 'Lossless';
      if (width === 0) {
        const bits = view.getUint32(dataStart + 1, true);
        width = (bits & 0x3fff) + 1;
        height = ((bits >> 14) & 0x3fff) + 1;
      }
    } else if (chunk === 'ALPH') {
      hasAlpha = true;
    } else if (chunk === 'EXIF') {
      hasExif = true;
      metadataBytes += length + 8;
      // Some encoders prefix the payload with the JPEG-style "Exif\0\0" header.
      const skip = ascii(bytes, dataStart, 6) === 'Exif\0\0' ? 6 : 0;
      const parsed = parseExif(view, dataStart + skip, length - skip);
      exifGroups = parsed.groups;
      gps = parsed.gps;
    } else if (chunk === 'XMP ') {
      hasXmp = true;
      metadataBytes += length + 8;
    } else if (chunk === 'ICCP') {
      hasIcc = true;
      metadataBytes += length + 8;
    }

    // RIFF chunks are padded to an even length.
    offset = dataStart + length + (length % 2);
  }

  groups.push({
    name: 'Image',
    entries: compact([
      { label: 'Format', value: 'WebP' },
      { label: 'Dimensions', value: width ? `${width} × ${height} px` : '—' },
      {
        label: 'Megapixels',
        value: width ? `${((width * height) / 1_000_000).toFixed(1)} MP` : '—',
      },
      { label: 'Compression', value: variant },
      { label: 'Transparency', value: hasAlpha ? 'Yes (alpha channel)' : 'No' },
      animated ? { label: 'Animation', value: 'Animated' } : null,
    ]),
  });

  groups.push(...exifGroups);

  if (!hasExif && !hasXmp) {
    notes.push('This WebP carries no EXIF or XMP metadata.');
  }
  if (gps) {
    notes.push('This image records the exact location where it was taken.');
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    format: 'WebP',
    width,
    height,
    groups,
    hasExif,
    hasXmp,
    hasIcc,
    gps,
    metadataBytes,
    notes,
  };
}

function readUint24(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

/* -------------------------------------------------------------------------- */
/* Shared helpers                                                             */
/* -------------------------------------------------------------------------- */

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  let out = '';
  for (let i = offset; i < offset + length && i < bytes.length; i += 1) {
    out += String.fromCharCode(bytes[i]);
  }
  return out;
}

function text(bytes: Uint8Array, offset: number, length: number): string {
  if (length <= 0) {
    return '';
  }
  const slice = bytes.subarray(offset, Math.min(offset + length, bytes.length));
  try {
    return new TextDecoder('utf-8', { fatal: false }).decode(slice).replace(/\0/g, '').trim();
  } catch {
    return ascii(bytes, offset, length).replace(/\0/g, '').trim();
  }
}

function truncate(value: string, max = 300): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function round(value: number): string | number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Number.isInteger(value) ? value : Number(value.toFixed(2));
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function compact(entries: (MetadataEntry | null)[]): MetadataEntry[] {
  return entries.filter((entry): entry is MetadataEntry => entry !== null && entry.value !== '');
}
