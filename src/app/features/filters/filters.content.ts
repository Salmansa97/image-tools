import { ToolPageContent } from '../../seo/seo.models';

export const FILTERS_CONTENT: ToolPageContent = {
  toolId: 'filters',
  path: '/image-filters',
  seoTitle: 'Image Filters Online — Free Brightness, Contrast & Colour Editor | ImageTools',
  seoDescription:
    'Apply image filters online for free. Adjust brightness, contrast, saturation, warmth and blur with a live preview, ready-made looks and full undo — all in your browser.',
  keywords: [
    'image filters',
    'photo filters online',
    'adjust brightness contrast',
    'black and white photo',
    'photo editor online',
    'saturation adjust',
  ],
  breadcrumbs: [
    { name: 'Home', path: '/' },
    { name: 'All Tools', path: '/tools' },
    { name: 'Image Filters', path: '/image-filters' },
  ],
  heading: 'Image Filters and Colour Adjustments',
  lead: 'Fine-tune brightness, contrast, saturation, warmth and blur with a preview that updates as you drag. Start from a ready-made look, then adjust — and undo anything you change your mind about.',
  howItWorksTitle: 'How to filter an image',
  features: [
    'Brightness, contrast and saturation',
    'Greyscale, sepia, hue shift and invert',
    'Adjustable blur',
    'Nine ready-made looks',
    'Unlimited undo and redo',
  ],
  steps: [
    {
      title: 'Load an image',
      body: 'Drop in a JPG, PNG or WebP file. It is read straight into your browser and never uploaded.',
    },
    {
      title: 'Pick a starting look',
      body: 'Choose a preset like Vivid, Mono or Vintage to get close quickly, or start from the original and build your own.',
    },
    {
      title: 'Adjust the sliders',
      body: 'Every slider updates the preview instantly. Undo and redo step through your changes if you go too far.',
    },
    {
      title: 'Export',
      body: 'Press Apply filters to render at full resolution, then download. The preview and the export use the same settings.',
    },
  ],
  benefitsTitle: 'Why edit here?',
  benefits: [
    {
      icon: 'bolt',
      title: 'A preview that tells the truth',
      body: 'The on-screen preview and the exported file are produced from one filter definition, so what you see really is what you get.',
    },
    {
      icon: 'undo',
      title: 'Undo and redo',
      body: 'Every change is a step you can walk back. Experiment freely — nothing is committed until you export.',
    },
    {
      icon: 'sparkles',
      title: 'Presets that are not a black box',
      body: 'Each preset is just a set of slider values, shown to you and editable. Take a look you like and adjust it rather than starting over.',
    },
    {
      icon: 'image',
      title: 'Full resolution output',
      body: 'Adjustments preview on a scaled-down image for speed, but export at the full original resolution.',
    },
    {
      icon: 'shield',
      title: 'Nothing uploaded',
      body: 'No account, no cloud processing, no images sitting on somebody else’s server waiting to be deleted.',
    },
    {
      icon: 'device',
      title: 'Works on any device',
      body: 'A phone on the train or a desktop at work — the same tool, with nothing to install.',
    },
  ],
  faqs: [
    {
      question: 'Will applying filters reduce image quality?',
      answer:
        'The adjustments themselves are applied at full resolution with no downscaling. The only quality change comes from re-encoding the result, so export as PNG, or as JPEG and WebP at a high quality setting, if you want to keep every detail.',
    },
    {
      question: 'What is the difference between brightness and contrast?',
      answer:
        'Brightness shifts every pixel lighter or darker by the same amount, which lifts shadows and highlights together. Contrast stretches the difference between light and dark, making bright areas brighter and dark areas darker. A flat photograph usually needs contrast rather than brightness.',
    },
    {
      question: 'How do I make an image black and white?',
      answer:
        'Choose the Mono preset, or push the greyscale slider to 100%. For a stronger look, Noir adds contrast and darkens the result, which suits portraits and architecture.',
    },
    {
      question: 'Can I undo a change?',
      answer:
        'Yes. Every adjustment is recorded as a step, and the undo and redo buttons walk through them. Resetting returns to the untouched original without losing the file.',
    },
    {
      question: 'Why does my preview look slightly different from the export?',
      answer:
        'It should not — both are generated from exactly the same filter definition, one applied by the browser to the preview element and one by the canvas during export. If an image contains an embedded colour profile, very slight differences in how the browser renders it are possible.',
    },
  ],
  prose: [
    {
      title: 'A sensible order to work in',
      paragraphs: [
        'Start with exposure. Get the overall brightness right first, because every other adjustment depends on it — adding saturation to an underexposed image just produces muddy colour.',
        'Then contrast. Most photographs taken on a phone are deliberately flat so that detail is retained for editing, and a modest contrast increase is what makes them look finished. Push it until the darkest part of the picture is genuinely dark, then stop.',
        'Saturation last, and sparingly. It is the adjustment people overdo most, and the first sign is skin tones turning orange. If only part of the image needs more life, a small contrast increase often reads as more colourful without touching saturation at all.',
      ],
    },
  ],
};
