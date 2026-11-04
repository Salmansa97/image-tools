import { IconName } from '../../shared/components/icon/icon.component';
import { FaqEntry } from '../../seo/seo.models';

export interface HomeStep {
  readonly title: string;
  readonly body: string;
  readonly icon: IconName;
}

export const HOME_STEPS: readonly HomeStep[] = [
  {
    icon: 'upload',
    title: 'Drop in your images',
    body: 'Drag files straight onto the page or browse for them. JPG, PNG and WebP are supported, up to 50 MB each, and nothing is uploaded anywhere.',
  },
  {
    icon: 'sparkles',
    title: 'Choose your settings',
    body: 'Set a quality level, exact dimensions, a crop ratio or a target format. Every option shows you what it will do before you commit.',
  },
  {
    icon: 'bolt',
    title: 'Process on your device',
    body: 'Your browser does the work in background threads using its built-in image engine, so even large batches finish fast without freezing the page.',
  },
  {
    icon: 'download',
    title: 'Download the results',
    body: 'Compare before and after, then save a single file or take the whole batch home as one ZIP archive.',
  },
];

export interface HomeBenefit {
  readonly icon: IconName;
  readonly title: string;
  readonly body: string;
}

export const HOME_BENEFITS: readonly HomeBenefit[] = [
  {
    icon: 'shield',
    title: 'Genuinely private',
    body: 'Not "we delete your files after an hour" — your images are never sent anywhere at all. You can turn off your internet connection after the page loads and every tool keeps working.',
  },
  {
    icon: 'bolt',
    title: 'Faster than uploading',
    body: 'There is no upload, no queue and no download of the result. A 10 MB photo that would take half a minute to round-trip through a server is processed here in well under a second.',
  },
  {
    icon: 'lock',
    title: 'No account, no limits',
    body: 'No sign-up, no email address, no daily cap and no watermark. There is nothing to pay for because there are no servers to pay for.',
  },
  {
    icon: 'sparkles',
    title: 'Real controls, not guesswork',
    body: 'See the exact quality level, the precise output dimensions and the resulting file size before you download. Nothing is decided for you behind the scenes.',
  },
  {
    icon: 'device',
    title: 'Works everywhere',
    body: 'A phone, a tablet, a locked-down work laptop — if it runs a modern browser, it runs these tools. There is nothing to install and no extension to approve.',
  },
  {
    icon: 'zip',
    title: 'Built for batches',
    body: 'Add a hundred images, process them all in parallel across several threads, watch each one progress, and download the lot as a single archive.',
  },
];

export const HOME_FAQS: readonly FaqEntry[] = [
  {
    question: 'Are my images uploaded to a server?',
    answer:
      'No. Every tool on this site uses the HTML5 Canvas API and Web Workers built into your browser, which means the processing happens on your own device. No image data is transmitted, logged or stored anywhere — you can verify it by opening your browser’s network tab, or simply by going offline after the page has loaded.',
  },
  {
    question: 'Is ImageTools really free?',
    answer:
      'Yes, with no catch. There is no account, no trial, no file limit, no watermark and no paid tier. Because the work happens on your device rather than on rented servers, there are no running costs to recover.',
  },
  {
    question: 'Which image formats are supported?',
    answer:
      'JPG (JPEG), PNG and WebP, in every combination — these are the formats that browsers can reliably both read and write. Each file can be up to 50 MB.',
  },
  {
    question: 'Will compressing my image make it look worse?',
    answer:
      'That depends on the quality level you choose, and you are in control of it. At 75–85% quality, JPEG and WebP compression is visually indistinguishable from the original for most photographs while cutting the file size by two thirds or more. The compressor shows you a before-and-after comparison so you can judge it yourself before downloading.',
  },
  {
    question: 'Can I process several images at once?',
    answer:
      'Yes. The compressor and the converter both accept whole folders, process images in parallel across background threads, show individual progress for each file, and let you download the finished set as a single ZIP archive. The resizer and cropper work on one image at a time so you can see exactly what you are getting.',
  },
  {
    question: 'Do I need to install anything?',
    answer:
      'No. ImageTools is a website. Open it in any modern browser on any device and the tools work immediately — no download, no extension, no permissions to grant.',
  },
  {
    question: 'What happens to my images when I close the tab?',
    answer:
      'They disappear. Images are held in your browser’s memory only while the tool is open, and the temporary references to them are released as soon as you remove a file, reset the tool or navigate away. Nothing is written to disk unless you explicitly download it.',
  },
  {
    question: 'Why is my PNG barely smaller after compression?',
    answer:
      'PNG is a lossless format, so a quality slider has nothing to discard — the pixels must come back exactly. ImageTools instead reduces the number of distinct colours, which genuinely shrinks PNG files, especially flat graphics and screenshots. For photographs, converting to WebP or JPG will always save far more.',
  },
];
