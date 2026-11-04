import {
  FileSelection,
  MAX_FILE_SIZE_BYTES,
  OutputFormat,
  RejectedFile,
  SUPPORTED_MIME_TYPES,
  SupportedMimeType,
  TRANSPARENT_FORMATS,
} from '../models/image.models';
import { SniffedType, sniffImageType, sniffedLabel } from './sniff';

/** Human label for each supported MIME type. */
const FORMAT_LABELS: Record<SupportedMimeType, string> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
};

const FORMAT_EXTENSIONS: Record<SupportedMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Extensions mapped back to a MIME type, for files the browser does not type. */
const EXTENSION_MIME: Record<string, SupportedMimeType> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  jpe: 'image/jpeg',
  jfif: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export const ACCEPT_ATTRIBUTE = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';

export function isSupportedMimeType(type: string): type is SupportedMimeType {
  return (SUPPORTED_MIME_TYPES as readonly string[]).includes(type);
}

export function formatLabel(type: string): string {
  return isSupportedMimeType(type)
    ? FORMAT_LABELS[type]
    : (extensionOf(type) || 'Image').toUpperCase();
}

export function extensionFor(type: SupportedMimeType): string {
  return FORMAT_EXTENSIONS[type];
}

export function supportsTransparency(type: SupportedMimeType): boolean {
  return TRANSPARENT_FORMATS.includes(type);
}

/**
 * Resolves a file's MIME type, falling back to its extension.
 * Some browsers/OS combinations hand over an empty `File.type` for WebP.
 */
export function resolveMimeType(file: File): string {
  if (isSupportedMimeType(file.type)) {
    return file.type;
  }
  const ext = extensionOf(file.name);
  return ext && EXTENSION_MIME[ext] ? EXTENSION_MIME[ext] : file.type;
}

/** Resolves `original` against the source type, guaranteeing an encodable format. */
export function resolveOutputFormat(format: OutputFormat, sourceType: string): SupportedMimeType {
  if (format !== 'original') {
    return format;
  }
  return isSupportedMimeType(sourceType) ? sourceType : 'image/jpeg';
}

export function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot > -1 ? fileName.slice(dot + 1).toLowerCase() : '';
}

export function baseNameOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  const base = dot > 0 ? fileName.slice(0, dot) : fileName;
  return base.trim() || 'image';
}

/** Builds an output file name, e.g. `holiday` + `image/webp` → `holiday-compressed.webp`. */
export function buildFileName(baseName: string, type: SupportedMimeType, suffix: string): string {
  const safe = sanitiseFileName(baseName);
  return `${safe}${suffix ? `-${suffix}` : ''}.${extensionFor(type)}`;
}

/** Strips characters that browsers or file systems reject in a download name. */
export function sanitiseFileName(name: string): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return (cleaned || 'image').slice(0, 80);
}

/** Ensures every entry in a ZIP has a unique path. */
export function uniqueName(name: string, taken: Set<string>): string {
  if (!taken.has(name)) {
    taken.add(name);
    return name;
  }
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  let counter = 2;
  let candidate = `${stem} (${counter})${ext}`;
  while (taken.has(candidate)) {
    counter += 1;
    candidate = `${stem} (${counter})${ext}`;
  }
  taken.add(candidate);
  return candidate;
}

/** Formats a byte count the way a file manager would. */
export function formatBytes(bytes: number, fractionDigits?: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '—';
  }
  if (bytes < 1024) {
    return `${Math.round(bytes)} B`;
  }
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const digits = fractionDigits ?? (value >= 100 ? 0 : value >= 10 ? 1 : 2);
  return `${value.toFixed(digits)} ${units[unitIndex]}`;
}

/** Percentage saved; negative when the output grew. */
export function savingsPercent(originalSize: number, newSize: number): number {
  if (originalSize <= 0) {
    return 0;
  }
  return Math.round(((originalSize - newSize) / originalSize) * 100);
}

/**
 * Validates a selection against its *declared* type.
 *
 * Fast and synchronous, which makes it the right check for the home page's
 * drop-and-choose step. Anything that will actually be decoded should go through
 * {@link validateFilesByContent} instead, which reads the real magic bytes.
 */
export function validateFiles(
  files: readonly File[],
  options: { maxSize?: number; existingKeys?: ReadonlySet<string> } = {},
): FileSelection {
  const maxSize = options.maxSize ?? MAX_FILE_SIZE_BYTES;
  const seen = new Set(options.existingKeys ?? []);
  const accepted: File[] = [];
  const rejected: RejectedFile[] = [];

  for (const file of files) {
    const type = resolveMimeType(file);

    if (!isSupportedMimeType(type)) {
      rejected.push({
        fileName: file.name,
        reason: 'unsupported-type',
        message: `“${file.name}” is not a JPG, PNG or WebP image.`,
      });
      continue;
    }
    if (file.size === 0) {
      rejected.push({
        fileName: file.name,
        reason: 'empty',
        message: `“${file.name}” is empty or unreadable.`,
      });
      continue;
    }
    if (file.size > maxSize) {
      rejected.push({
        fileName: file.name,
        reason: 'too-large',
        message: `“${file.name}” is ${formatBytes(file.size)} — the limit is ${formatBytes(maxSize, 0)}.`,
      });
      continue;
    }

    const key = fileKey(file);
    if (seen.has(key)) {
      rejected.push({
        fileName: file.name,
        reason: 'duplicate',
        message: `“${file.name}” has already been added.`,
      });
      continue;
    }

    seen.add(key);
    accepted.push(file);
  }

  return { accepted, rejected };
}

/** Identity for de-duplication: same name, size and modification time. */
export function fileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

/** Reads `DataTransfer` contents, walking directories when the browser exposes them. */
export async function filesFromDataTransfer(dataTransfer: DataTransfer): Promise<File[]> {
  const items = Array.from(dataTransfer.items ?? []);
  const supportsEntries = items.some(
    (item) => typeof (item as DataTransferItem).webkitGetAsEntry === 'function',
  );

  if (!supportsEntries) {
    return Array.from(dataTransfer.files ?? []);
  }

  const entries = items
    .filter((item) => item.kind === 'file')
    .map((item) => item.webkitGetAsEntry())
    .filter((entry): entry is FileSystemEntry => entry !== null);

  if (entries.length === 0) {
    return Array.from(dataTransfer.files ?? []);
  }

  const collected: File[] = [];
  await Promise.all(entries.map((entry) => collectEntry(entry, collected)));
  return collected;
}

async function collectEntry(entry: FileSystemEntry, out: File[], depth = 0): Promise<void> {
  // Guard against pathological nesting; three levels covers any realistic drop.
  if (depth > 3) {
    return;
  }
  if (entry.isFile) {
    const file = await new Promise<File | null>((resolve) => {
      (entry as FileSystemFileEntry).file(resolve, () => resolve(null));
    });
    if (file) {
      out.push(file);
    }
    return;
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const children = await readAllDirectoryEntries(reader);
    for (const child of children) {
      await collectEntry(child, out, depth + 1);
    }
  }
}

function readAllDirectoryEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve) => {
    const all: FileSystemEntry[] = [];
    const readBatch = () => {
      reader.readEntries(
        (batch) => {
          if (batch.length === 0) {
            resolve(all);
            return;
          }
          all.push(...batch);
          readBatch();
        },
        () => resolve(all),
      );
    };
    readBatch();
  });
}

/**
 * Validates a selection against the file's *actual* content.
 *
 * Reads each file's magic bytes rather than trusting the type the operating
 * system inferred from its extension. Besides being the only safe check, it
 * produces far better messages: a renamed HEIC can be named as a HEIC instead of
 * failing mysteriously inside the decoder.
 */
export async function validateFilesByContent(
  files: readonly File[],
  options: { maxSize?: number; existingKeys?: ReadonlySet<string> } = {},
): Promise<FileSelection> {
  const maxSize = options.maxSize ?? MAX_FILE_SIZE_BYTES;
  const seen = new Set(options.existingKeys ?? []);
  const accepted: File[] = [];
  const rejected: RejectedFile[] = [];

  for (const file of files) {
    if (file.size === 0) {
      rejected.push({
        fileName: file.name,
        reason: 'empty',
        message: `“${file.name}” is empty or unreadable.`,
      });
      continue;
    }
    if (file.size > maxSize) {
      rejected.push({
        fileName: file.name,
        reason: 'too-large',
        message: `“${file.name}” is ${formatBytes(file.size)} — the limit is ${formatBytes(maxSize, 0)}.`,
      });
      continue;
    }

    let sniffed: SniffedType;
    try {
      sniffed = await sniffImageType(file);
    } catch {
      rejected.push({
        fileName: file.name,
        reason: 'empty',
        message: `“${file.name}” could not be read from your device.`,
      });
      continue;
    }

    if (sniffed === null || !isSupportedMimeType(sniffed)) {
      rejected.push({
        fileName: file.name,
        reason: 'unsupported-type',
        message:
          sniffed === null
            ? `“${file.name}” is not an image file.`
            : `“${file.name}” is ${sniffedLabel(sniffed)}, which browsers cannot re-encode. Convert it to JPG, PNG or WebP first.`,
      });
      continue;
    }

    const key = fileKey(file);
    if (seen.has(key)) {
      rejected.push({
        fileName: file.name,
        reason: 'duplicate',
        message: `“${file.name}” has already been added.`,
      });
      continue;
    }

    seen.add(key);
    accepted.push(file);
  }

  return { accepted, rejected };
}

/**
 * The real type of a file, as read from its bytes.
 *
 * Preferred over {@link resolveMimeType} once a file has been accepted, because
 * an image saved with the wrong extension would otherwise be labelled wrongly
 * throughout the interface.
 */
export async function detectMimeType(file: File): Promise<string> {
  const sniffed = await sniffImageType(file);
  return sniffed && isSupportedMimeType(sniffed) ? sniffed : resolveMimeType(file);
}
