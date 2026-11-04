/**
 * Shared domain types for every image tool.
 *
 * These types are used on the main thread *and* inside the image worker, so they
 * must not reference anything Angular- or DOM-specific beyond structured-cloneable
 * values (`Blob`, `File`, plain objects).
 */

/** MIME types the application can both decode and encode. */
export const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

/** Target format for an operation; `original` keeps the source image's MIME type. */
export type OutputFormat = SupportedMimeType | 'original';

/** Formats that carry an alpha channel. */
export const TRANSPARENT_FORMATS: readonly SupportedMimeType[] = ['image/png', 'image/webp'];

/** Maximum accepted size for a single file, in bytes (50 MB). */
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

/** Lifecycle of a single image inside a batch. */
export type ImageStatus = 'ready' | 'queued' | 'processing' | 'done' | 'error' | 'cancelled';

/** A file the user added, plus everything the UI needs to render it. */
export interface ImageItem {
  readonly id: string;
  readonly file: File;
  /** Original file name including extension, e.g. `holiday.png`. */
  readonly fileName: string;
  /** File name without its extension, e.g. `holiday`. */
  readonly baseName: string;
  readonly sourceType: string;
  readonly sourceSize: number;
  /** Object URL for the untouched source file. Must be revoked on removal. */
  readonly previewUrl: string;
  readonly width: number;
  readonly height: number;
  readonly status: ImageStatus;
  /** 0–100. Coarse-grained: decoding/encoding cannot report fine progress. */
  readonly progress: number;
  readonly error?: string;
  readonly result?: ProcessedImage;
}

/** The output of a successful operation. */
export interface ProcessedImage {
  readonly blob: Blob;
  /** Object URL for `blob`. Must be revoked when replaced or removed. */
  readonly url: string;
  readonly size: number;
  readonly type: SupportedMimeType;
  readonly width: number;
  readonly height: number;
  readonly fileName: string;
}

/* -------------------------------------------------------------------------- */
/* Operation options                                                          */
/* -------------------------------------------------------------------------- */

export interface CompressOptions {
  readonly kind: 'compress';
  /** 10–100. Maps to encoder quality, and to palette size for PNG output. */
  readonly quality: number;
  readonly format: OutputFormat;
  /** Optionally clamp the longest edge, which is often the biggest win. */
  readonly maxDimension: number | null;
  /** Flattening colour for formats without alpha. */
  readonly background: string;
}

export interface ResizeOptions {
  readonly kind: 'resize';
  readonly width: number;
  readonly height: number;
  readonly format: OutputFormat;
  readonly quality: number;
  readonly background: string;
}

export interface ConvertOptions {
  readonly kind: 'convert';
  readonly format: SupportedMimeType;
  readonly quality: number;
  readonly background: string;
}

export interface CropOptions {
  readonly kind: 'crop';
  /** Crop rectangle in *post-transform* pixel coordinates. */
  readonly sx: number;
  readonly sy: number;
  readonly sw: number;
  readonly sh: number;
  readonly rotate: RotationAngle;
  readonly flipH: boolean;
  readonly flipV: boolean;
  readonly format: OutputFormat;
  readonly quality: number;
  readonly background: string;
}

export type RotationAngle = 0 | 90 | 180 | 270;

/** Free rotation and mirroring, with the canvas expanded to fit the result. */
export interface TransformOptions {
  readonly kind: 'transform';
  /** Clockwise degrees. Any angle; the output grows to contain the rotation. */
  readonly rotate: number;
  readonly flipH: boolean;
  readonly flipV: boolean;
  readonly format: OutputFormat;
  readonly quality: number;
  /** Painted behind the image, which matters for the corners a free rotation exposes. */
  readonly background: string;
  /** Leave the corners transparent instead of filling them (PNG/WebP only). */
  readonly transparentCorners: boolean;
}

/** Colour adjustments, expressed the same way CSS filters are. */
export interface FilterValues {
  /** Percent, 100 = unchanged. */
  readonly brightness: number;
  readonly contrast: number;
  readonly saturate: number;
  /** Percent, 0 = unchanged. */
  readonly grayscale: number;
  readonly sepia: number;
  readonly invert: number;
  /** Degrees. */
  readonly hueRotate: number;
  /** Pixels. */
  readonly blur: number;
}

export const NEUTRAL_FILTERS: FilterValues = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  grayscale: 0,
  sepia: 0,
  invert: 0,
  hueRotate: 0,
  blur: 0,
};

export interface FilterOptions {
  readonly kind: 'filter';
  readonly filters: FilterValues;
  readonly format: OutputFormat;
  readonly quality: number;
  readonly background: string;
}

export type WatermarkPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface WatermarkOptions {
  readonly kind: 'watermark';
  readonly mode: 'text' | 'image';
  readonly text: string;
  readonly fontFamily: string;
  /** Percent of the image's shortest edge, so it scales with the picture. */
  readonly fontScale: number;
  readonly color: string;
  readonly opacity: number;
  readonly position: WatermarkPosition;
  /** Percent of the shortest edge. */
  readonly margin: number;
  readonly rotation: number;
  /** Repeat the mark across the whole image rather than placing it once. */
  readonly tile: boolean;
  readonly tileGap: number;
  /** Percent of the base image's width, for an image watermark. */
  readonly imageScale: number;
  /** The overlay image, when `mode` is `image`. */
  readonly overlay?: Blob;
  readonly shadow: boolean;
  readonly format: OutputFormat;
  readonly quality: number;
  readonly background: string;
}

export type FitMode = 'cover' | 'contain' | 'stretch';

/** Resize into an exact frame, used by the social and favicon generators. */
export interface FitOptions {
  readonly kind: 'fit';
  readonly width: number;
  readonly height: number;
  readonly fit: FitMode;
  readonly background: string;
  /** Keep `contain` padding transparent instead of filling it. */
  readonly transparentPadding: boolean;
  readonly format: OutputFormat;
  readonly quality: number;
}

/** Cut the background out of an image, with optional manual brush overrides. */
export interface RemoveBackgroundOptions {
  readonly kind: 'remove-background';
  readonly tolerance: number;
  readonly edgeSoftness: number;
  readonly shrink: number;
  readonly despill: number;
  readonly mode: 'contiguous' | 'global';
  readonly keyColor: { r: number; g: number; b: number } | null;
  /** Brush overrides, at `manualWidth` × `manualHeight`; rescaled to the source. */
  readonly manual?: Uint8Array;
  readonly manualWidth?: number;
  readonly manualHeight?: number;
  /** Painted behind the subject instead of transparency. */
  readonly background: 'transparent' | string;
  readonly format: OutputFormat;
  readonly quality: number;
}

export type ProcessOptions =
  | CompressOptions
  | ResizeOptions
  | ConvertOptions
  | CropOptions
  | TransformOptions
  | FilterOptions
  | WatermarkOptions
  | FitOptions
  | RemoveBackgroundOptions;

/* -------------------------------------------------------------------------- */
/* Worker protocol                                                            */
/* -------------------------------------------------------------------------- */

export interface WorkerRequest {
  readonly id: string;
  readonly file: Blob;
  readonly options: ProcessOptions;
}

export interface WorkerSuccess {
  readonly id: string;
  readonly ok: true;
  readonly blob: Blob;
  readonly type: SupportedMimeType;
  readonly width: number;
  readonly height: number;
}

export interface WorkerFailure {
  readonly id: string;
  readonly ok: false;
  readonly error: string;
}

export type WorkerResponse = WorkerSuccess | WorkerFailure;

/** What a processing service hands back to a feature component. */
export interface ProcessOutput {
  readonly blob: Blob;
  readonly type: SupportedMimeType;
  readonly width: number;
  readonly height: number;
}

/* -------------------------------------------------------------------------- */
/* Upload validation                                                          */
/* -------------------------------------------------------------------------- */

export type RejectionReason = 'unsupported-type' | 'too-large' | 'empty' | 'duplicate';

export interface RejectedFile {
  readonly fileName: string;
  readonly reason: RejectionReason;
  readonly message: string;
}

export interface FileSelection {
  readonly accepted: readonly File[];
  readonly rejected: readonly RejectedFile[];
}
