/**
 * Dedicated worker that runs the image pipeline off the main thread.
 *
 * Decoding and encoding a large photo blocks for hundreds of milliseconds; doing
 * that on the UI thread makes bulk operations freeze the page. The worker keeps
 * the interface responsive and lets us run several images concurrently.
 */

import { WorkerRequest, WorkerResponse } from '../models/image.models';
import { processImage } from '../utilities/image-processor';

addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;

  void processImage(request.file, request.options)
    .then((output) => {
      const response: WorkerResponse = {
        id: request.id,
        ok: true,
        blob: output.blob,
        type: output.type,
        width: output.width,
        height: output.height,
      };
      postMessage(response);
    })
    .catch((error: unknown) => {
      const response: WorkerResponse = {
        id: request.id,
        ok: false,
        error: error instanceof Error ? error.message : 'This image could not be processed.',
      };
      postMessage(response);
    });
});
