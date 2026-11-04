import { ToolPageContent } from '../../seo/seo.models';

export const BASE64_CONTENT: ToolPageContent = {
  toolId: 'base64',
  path: '/image-to-base64',
  seoTitle: 'Image to Base64 Converter — Free Data URI Encoder & Decoder | ImageTools',
  seoDescription:
    'Convert an image to a Base64 data URI for CSS, HTML or JSON, and decode Base64 back into a file. Free, instant and processed entirely in your browser.',
  keywords: [
    'image to base64',
    'base64 encoder',
    'data uri generator',
    'base64 to image',
    'base64 decode image',
    'inline image css',
  ],
  breadcrumbs: [
    { name: 'Home', path: '/' },
    { name: 'All Tools', path: '/tools' },
    { name: 'Image to Base64', path: '/image-to-base64' },
  ],
  heading: 'Image to Base64 Converter',
  lead: 'Turn an image into a Base64 data URI you can paste straight into CSS, HTML or JSON — and go the other way, decoding Base64 back into a downloadable file.',
  howItWorksTitle: 'How to convert an image to Base64',
  features: [
    'Data URI, CSS, HTML and JSON output',
    'One-click copy for each format',
    'Base64 back to a downloadable image',
    'Size impact shown before you copy',
    'Runs entirely in your browser',
  ],
  steps: [
    {
      title: 'Add your image',
      body: 'Drop in a JPG, PNG or WebP. Small icons and logos are the usual candidates for inlining.',
    },
    {
      title: 'Pick an output format',
      body: 'A raw data URI, a CSS background rule, an HTML img tag or a JSON string — whichever you are pasting into.',
    },
    {
      title: 'Check the size',
      body: 'Base64 is about a third larger than the original bytes. The encoded size is shown so you can decide whether inlining is worth it.',
    },
    {
      title: 'Copy, or decode',
      body: 'Copy the result in one click. To go the other way, switch to the decode tab and paste Base64 in.',
    },
  ],
  benefitsTitle: 'Why inline an image?',
  benefits: [
    {
      icon: 'code',
      title: 'One fewer request',
      body: 'An inlined image arrives with the stylesheet or document, saving a round trip. For small icons on a slow connection that is a real win.',
    },
    {
      icon: 'bolt',
      title: 'No broken paths',
      body: 'A data URI carries its own data, so it cannot 404. Useful for email templates, exported documents and self-contained HTML files.',
    },
    {
      icon: 'convert',
      title: 'Works both ways',
      body: 'Decode a Base64 string you found in a stylesheet or an API response back into a real file you can open.',
    },
    {
      icon: 'info',
      title: 'Honest about the trade-off',
      body: 'The encoded size is shown next to the original, because inlining a large photograph usually makes a page slower, not faster.',
    },
    {
      icon: 'shield',
      title: 'Nothing uploaded',
      body: 'Encoding happens with the browser’s own FileReader. Your file is never sent anywhere.',
    },
    {
      icon: 'device',
      title: 'No tooling needed',
      body: 'No command line, no npm package — paste the result straight into your editor.',
    },
  ],
  faqs: [
    {
      question: 'What is a Base64 data URI?',
      answer:
        'A way of embedding a file directly in text. The image bytes are encoded using 64 printable characters and prefixed with the MIME type, giving a string like `data:image/png;base64,iVBORw0…` that a browser treats exactly like a URL pointing at the file.',
    },
    {
      question: 'Does Base64 make my image bigger?',
      answer:
        'Yes — about 33% larger, because every three bytes become four characters. That overhead is often worth it for a small icon where you save an HTTP request, and almost never worth it for a photograph.',
    },
    {
      question: 'When should I not inline an image?',
      answer:
        'When the image is large, reused across several pages, or likely to change. Inlined images cannot be cached separately, so every page that embeds one re-downloads it, and any change means re-deploying the stylesheet that contains it. The usual guidance is to inline below a few kilobytes.',
    },
    {
      question: 'Can I convert Base64 back to an image?',
      answer:
        'Yes. Switch to the decode tab and paste the string, with or without the `data:` prefix. The tool works out the format and gives you a downloadable file.',
    },
    {
      question: 'Is there a size limit?',
      answer:
        'Files up to 50 MB are accepted, but a data URI that large is impractical — some tools and older browsers cap URI length, and the string becomes unwieldy in an editor. Inlining is for small assets.',
    },
  ],
  prose: [
    {
      title: 'When inlining actually helps',
      paragraphs: [
        'The case for a data URI is saving a network request. On a connection with high latency, the round trip to fetch a 1 KB icon can cost more than transferring its bytes, so folding it into a stylesheet you were loading anyway is a genuine improvement.',
        'That logic inverts as files grow. A 200 KB inlined photograph makes the stylesheet 270 KB, and the stylesheet blocks rendering — so the page now waits on an image it would otherwise have loaded in parallel and cached separately. The common rule of thumb is to inline below about 4 KB and link anything larger.',
        'Caching is the other consideration. A linked image is cached once and reused across every page; an inlined one is re-downloaded with every document that contains it, and changing it invalidates the whole file it lives in. For an icon that never changes, that is fine; for anything else it is a poor trade.',
      ],
    },
  ],
};
