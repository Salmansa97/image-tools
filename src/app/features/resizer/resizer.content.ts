import { ToolPageContent } from '../../seo/seo.models';

export const RESIZER_CONTENT: ToolPageContent = {
  toolId: 'resize',
  path: '/resize-image',
  seoTitle: 'Resize Image Online — Free Image Resizer for JPG, PNG & WebP | ImageTools',
  seoDescription:
    'Resize images online for free. Set exact pixel dimensions, lock the aspect ratio, scale by percentage or use presets for Full HD, Instagram and more — all in your browser.',
  keywords: [
    'resize image',
    'image resizer',
    'change image dimensions',
    'resize jpg',
    'resize png',
    'scale image online',
  ],
  breadcrumbs: [
    { name: 'Home', path: '/' },
    { name: 'Resize Image', path: '/resize-image' },
  ],
  heading: 'Resize Images to Any Dimension',
  lead: 'Type the exact width and height you need, scale by percentage, or pick a preset for Full HD, YouTube or Instagram. The aspect ratio stays locked unless you tell it otherwise.',
  howItWorksTitle: 'How to resize an image',
  features: [
    'Exact pixel width and height',
    'Aspect-ratio lock',
    'Percentage scaling',
    'Presets for social media and HD video',
    'Choice of output format and quality',
  ],
  steps: [
    {
      title: 'Open your image',
      body: 'Drop a JPG, PNG or WebP file onto the page. Its current dimensions appear straight away.',
    },
    {
      title: 'Set the new size',
      body: 'Enter a width or a height, drag the percentage slider, or choose one of the presets. With the ratio locked, the other dimension follows automatically.',
    },
    {
      title: 'Choose a format',
      body: 'Keep the original format or switch to JPG, PNG or WebP, and set the encoding quality for the lossy formats.',
    },
    {
      title: 'Download the result',
      body: 'Preview the resized image at its true proportions, check the new file size, and save it to your device.',
    },
  ],
  benefitsTitle: 'A resizer that respects your image',
  benefits: [
    {
      icon: 'sparkles',
      title: 'Proper downscaling',
      body: 'Shrinking an image in one step produces jagged edges. We halve the image repeatedly instead, which keeps fine detail and text legible.',
    },
    {
      icon: 'resize',
      title: 'Aspect ratio that stays put',
      body: 'Lock the ratio and the second dimension updates as you type. Unlock it when you deliberately want to stretch or squash.',
    },
    {
      icon: 'bolt',
      title: 'Presets for real platforms',
      body: 'Full HD, HD, square and portrait social posts, and classic 4:3 — the sizes people actually need, one click away.',
    },
    {
      icon: 'shield',
      title: 'Completely private',
      body: 'The image is decoded, redrawn and re-encoded by your own browser. Nothing is transmitted, logged or stored anywhere.',
    },
    {
      icon: 'image',
      title: 'Transparency preserved',
      body: 'Resize a transparent PNG or WebP and the alpha channel survives intact. Converting to JPG flattens it onto a colour you pick.',
    },
    {
      icon: 'device',
      title: 'No installs, no account',
      body: 'Works the same on a phone, a tablet and a locked-down office laptop. Open the page and start resizing.',
    },
  ],
  faqs: [
    {
      question: 'Will resizing make my image blurry?',
      answer:
        'Making an image smaller is safe — detail is discarded but what remains stays sharp, especially with the stepped downscaling this tool uses. Making an image larger cannot invent detail that was never captured, so enlarging beyond about 150% of the original will look soft no matter which tool you use.',
    },
    {
      question: 'How do I resize an image without stretching it?',
      answer:
        'Leave the "Maintain aspect ratio" box ticked. Change either the width or the height and the other value is recalculated to match the original proportions, so the picture is never distorted.',
    },
    {
      question: 'What size should I use for social media?',
      answer:
        'Square posts are 1080 × 1080 pixels and portrait posts are 1080 × 1350. For video thumbnails and wide banners use 1280 × 720 or 1920 × 1080. All four are available as presets.',
    },
    {
      question: 'Can I resize several images at once?',
      answer:
        'The resizer works on one image at a time so you can see exactly what you are getting. If you need to shrink a whole folder, the compressor accepts a batch and has a resolution limit that caps the longest edge of every image.',
    },
    {
      question: 'Does resizing reduce the file size?',
      answer:
        'Yes, substantially. File size scales roughly with pixel count, so halving both dimensions removes about three quarters of the pixels. Combining a smaller size with a quality setting around 80% is the most effective way to prepare images for the web.',
    },
  ],
  prose: [
    {
      title: 'Pixels, dimensions and file size',
      paragraphs: [
        "An image's dimensions are the number of pixels across and down. A 4000 × 3000 photograph contains twelve million pixels; the same picture at 1000 × 750 contains three quarters of a million. That is why resizing is far more effective than compression alone when a file is simply too large.",
        'Screens complicate this slightly. A high-density display shows roughly two device pixels for every CSS pixel, so an image meant to appear 600 pixels wide on a website is usually exported at 1200 pixels. Going beyond that adds weight without any visible benefit.',
        'If you are unsure, start from where the image will be used rather than from the file you have. Decide the display size, double it for high-density screens, and resize to that. Then set the quality around 80% and compare the result — in most cases the file ends up a fraction of the original with no visible difference.',
      ],
    },
  ],
};
