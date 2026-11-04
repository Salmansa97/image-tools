import { ToolPageContent } from '../../seo/seo.models';

export const COLORS_CONTENT: ToolPageContent = {
  toolId: 'colors',
  path: '/image-color-picker',
  seoTitle: 'Image Colour Picker — Free HEX, RGB & HSL Picker and Palette Extractor | ImageTools',
  seoDescription:
    'Pick colours from any image online. Click a pixel for its HEX, RGB and HSL value, extract the dominant palette, and copy it — all processed in your browser.',
  keywords: [
    'image color picker',
    'colour picker from image',
    'hex color from image',
    'extract palette from image',
    'eyedropper tool online',
    'rgb picker',
  ],
  breadcrumbs: [
    { name: 'Home', path: '/' },
    { name: 'All Tools', path: '/tools' },
    { name: 'Colour Picker', path: '/image-color-picker' },
  ],
  heading: 'Image Colour Picker and Palette Extractor',
  lead: 'Click any pixel to read its exact colour in HEX, RGB and HSL, and pull the dominant palette out of a photograph to use in a design.',
  howItWorksTitle: 'How to pick colours from an image',
  features: [
    'Click or tap any pixel to sample it',
    'HEX, RGB and HSL with one-click copy',
    'Automatic palette extraction',
    'Share of the image each colour covers',
    'Copy the whole palette as CSS variables',
  ],
  steps: [
    {
      title: 'Load an image',
      body: 'Drop in a photograph, screenshot or logo. It is read straight into your browser.',
    },
    {
      title: 'Click to sample',
      body: 'Click or tap anywhere on the image to read that pixel. Keyboard users can step the crosshair with the arrow keys.',
    },
    {
      title: 'Review the palette',
      body: 'The dominant colours are extracted automatically, each with the share of the image it covers.',
    },
    {
      title: 'Copy what you need',
      body: 'Copy a single value, or take the whole palette as a block of CSS custom properties.',
    },
  ],
  benefitsTitle: 'Why pick colours here?',
  benefits: [
    {
      icon: 'palette',
      title: 'Three formats at once',
      body: 'HEX for CSS, RGB for most design tools, HSL for reasoning about lightness and saturation — all shown together, no conversion needed.',
    },
    {
      icon: 'grid',
      title: 'A real palette, not a guess',
      body: 'Colours are extracted with the same median-cut algorithm the PNG compressor uses, then near-duplicates are merged so you get distinct colours rather than five shades of sky.',
    },
    {
      icon: 'eye',
      title: 'Proportions included',
      body: 'Each swatch shows how much of the image it covers, which tells you what is a dominant colour and what is an accent.',
    },
    {
      icon: 'code',
      title: 'Copy-ready output',
      body: 'Take the palette as CSS custom properties and paste it straight into a stylesheet.',
    },
    {
      icon: 'shield',
      title: 'Nothing uploaded',
      body: 'Client artwork and unreleased designs are exactly what you should not be uploading to sample a colour.',
    },
    {
      icon: 'device',
      title: 'Works by touch',
      body: 'Tap to sample on a phone, with a magnified readout so your finger is not covering the pixel you want.',
    },
  ],
  faqs: [
    {
      question: 'What is the difference between HEX, RGB and HSL?',
      answer:
        'They describe the same colour in different ways. HEX and RGB both give red, green and blue amounts — HEX in hexadecimal, RGB in decimal. HSL instead gives hue, saturation and lightness, which is far easier to reason about when you want "the same colour but darker".',
    },
    {
      question: 'How is the palette chosen?',
      answer:
        'Pixels are bucketed into a colour histogram, the largest buckets are taken in order, and any bucket too close to one already chosen is skipped. That last step is what stops a sky-heavy photograph returning eight nearly identical blues.',
    },
    {
      question: 'Why does the colour I picked look different in my design tool?',
      answer:
        'Usually a colour profile. If the image has an embedded profile, your browser and your design application may interpret the same stored values slightly differently. For exact matching, work in the same colour space throughout.',
    },
    {
      question: 'Can I pick a colour from a transparent area?',
      answer:
        'Fully transparent pixels are ignored during palette extraction, since their colour is invisible. Sampling one directly reports the stored value along with its alpha, which is occasionally useful for debugging.',
    },
    {
      question: 'Is the image uploaded to extract its colours?',
      answer:
        'No. The image is drawn to a canvas in your browser and the pixels are read from there. Nothing is transmitted.',
    },
  ],
  prose: [
    {
      title: 'Building a palette from a photograph',
      paragraphs: [
        'Pulling colours from an image is one of the quickest ways to find a palette that feels coherent, because the colours in a photograph already sit together under one light. What comes out is a starting point rather than a finished scheme.',
        'The usual adjustment is contrast. Extracted colours tend to cluster in the middle of the range, which makes for a pleasant but flat palette. Darkening the darkest and lightening the lightest — easiest to do in HSL, where you only change the L value — gives you something usable for text and backgrounds.',
        'Watch the proportions too. A colour covering 40% of a photograph works as a background; one covering 2% is an accent and will overwhelm a layout if used the same way. The share shown on each swatch is there to make that judgement easy.',
      ],
    },
  ],
};
