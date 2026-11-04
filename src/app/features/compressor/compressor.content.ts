import { ToolPageContent } from '../../seo/seo.models';

export const COMPRESSOR_CONTENT: ToolPageContent = {
  toolId: 'compress',
  path: '/compress-image',
  seoTitle: 'Compress Image Online — Free JPG, PNG & WebP Compressor | ImageTools',
  seoDescription:
    'Compress JPG, PNG and WebP images online for free. Choose your own quality level, compare before and after, and download single files or a ZIP — all without uploading anything.',
  keywords: [
    'compress image',
    'image compressor',
    'compress jpg',
    'compress png',
    'reduce image size',
    'online image compression',
  ],
  breadcrumbs: [
    { name: 'Home', path: '/' },
    { name: 'Compress Image', path: '/compress-image' },
  ],
  heading: 'Compress Images Without Losing Quality',
  lead: 'Cut image file sizes by up to 80% with a quality slider you control. Drop in as many JPG, PNG or WebP files as you like, compare the result side by side, and download them individually or as a ZIP.',
  howItWorksTitle: 'How to compress an image',
  features: [
    'Bulk image compression',
    'Adjustable quality from 10% to 100%',
    'Before and after comparison',
    'JPG, PNG and WebP support',
    'Download all results as a ZIP',
  ],
  steps: [
    {
      title: 'Add your images',
      body: 'Drag files onto the upload area or browse for them. You can add several at once, up to 50 MB each.',
    },
    {
      title: 'Pick a quality level',
      body: 'Start at 75% — it is visually identical for most photographs. Lower the slider for smaller files, raise it for archival quality.',
    },
    {
      title: 'Compress on your device',
      body: 'Press Compress Images. The work happens in a background thread in your browser, so the page stays responsive.',
    },
    {
      title: 'Compare and download',
      body: 'Drag the comparison handle to inspect the result, then save a single image or take the whole batch as a ZIP.',
    },
  ],
  benefitsTitle: 'Why compress with ImageTools?',
  benefits: [
    {
      icon: 'shield',
      title: 'Nothing is uploaded',
      body: 'Your pictures are decoded and re-encoded by your own browser. No server ever receives them, so there is nothing to leak and nothing to delete.',
    },
    {
      icon: 'bolt',
      title: 'Fast, even in bulk',
      body: 'Compression runs in Web Workers across several images at once, so a folder of photos finishes in seconds instead of blocking the tab.',
    },
    {
      icon: 'sparkles',
      title: 'You choose the trade-off',
      body: 'Most compressors hide their settings. Here you see the exact quality level, the resulting file size, and the percentage saved before you commit.',
    },
    {
      icon: 'image',
      title: 'Real PNG compression',
      body: 'PNG is lossless, so quality sliders normally do nothing. We reduce the colour palette instead, which genuinely shrinks PNG files.',
    },
    {
      icon: 'device',
      title: 'Works on any device',
      body: 'A phone, a locked-down work laptop, a tablet — if it has a modern browser, the compressor works. There is nothing to install.',
    },
    {
      icon: 'zip',
      title: 'Batch-friendly downloads',
      body: 'Compress a hundred images and take them all home in a single ZIP archive, built on your device just like the images themselves.',
    },
  ],
  faqs: [
    {
      question: 'Does compressing an image reduce its quality?',
      answer:
        'JPEG and WebP compression is lossy, so some detail is discarded — but at 70–80% quality the difference is invisible at normal viewing sizes while the file is often three to five times smaller. Use the before-and-after slider to judge it yourself before downloading.',
    },
    {
      question: 'Why did my PNG barely get smaller?',
      answer:
        'PNG is a lossless format, so re-encoding one at "70% quality" is meaningless — the pixels have to come back exactly. ImageTools instead reduces the number of distinct colours in the image, which gives the PNG compressor much more repetition to work with. For photographs, converting to WebP or JPEG will always save far more.',
    },
    {
      question: 'Is there a limit on how many images I can compress?',
      answer:
        'There is no fixed limit on the number of images. Each file can be up to 50 MB, and the practical ceiling is simply how much memory your device has — a few hundred photos at a time is comfortable on a modern laptop.',
    },
    {
      question: 'Are my images uploaded to a server?',
      answer:
        'No. All processing uses the HTML5 Canvas API inside your browser. You can disconnect from the internet after the page loads and every tool will keep working.',
    },
    {
      question: 'Which format should I choose for the smallest file?',
      answer:
        'WebP is usually the smallest for both photographs and graphics, typically 25–35% below an equivalent JPEG. Choose JPG when you need maximum compatibility with older software, and PNG only when you need transparency or pixel-exact reproduction.',
    },
  ],
  prose: [
    {
      title: 'Choosing the right quality level',
      paragraphs: [
        'Image compression is a trade: every percentage point you give up in quality buys you a smaller file. The useful range for photographs sits between 60% and 85%. Below 60% you start to see blocking in skies and smooth gradients; above 85% the file grows quickly while the visible improvement is marginal.',
        'Graphics with flat colour and sharp edges — logos, screenshots, diagrams — behave differently. Lossy compression smears their edges, so they are usually better served by PNG with a reduced palette, or by WebP, which handles both photographic and flat content well.',
        'If you are preparing images for a website, remember that dimensions matter at least as much as quality. A 4000-pixel-wide photograph displayed in a 800-pixel column wastes most of its bytes. Use the longest-edge limit in the options panel to cap the resolution and the quality slider to fine-tune what is left.',
      ],
    },
  ],
};
