import { ProcessOutput, ProcessedImage } from '../models/image.models';
import { buildFileName } from '../utilities/file.utils';

/**
 * Wraps a raw pipeline output into the shape the UI binds to, creating the object
 * URL used for previews and downloads.
 *
 * The caller owns that URL and must revoke it — see `ImageBatchStore`.
 */
export function toProcessedImage(
  output: ProcessOutput,
  baseName: string,
  suffix: string,
): ProcessedImage {
  return {
    blob: output.blob,
    url: URL.createObjectURL(output.blob),
    size: output.blob.size,
    type: output.type,
    width: output.width,
    height: output.height,
    fileName: buildFileName(baseName, output.type, suffix),
  };
}
