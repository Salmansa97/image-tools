import { ToolPageContent } from '../../seo/seo.models';

export const FLIP_CONTENT: ToolPageContent = {
  toolId: 'flip',
  path: '/flip-image',
  seoTitle: 'Flip Image Online — Free Horizontal & Vertical Image Mirror | ImageTools',
  seoDescription:
    'Flip images online for free. Mirror a photo horizontally or vertically in your browser — perfect for selfies, scanned film and artwork facing the wrong way.',
  keywords: [
    'flip image',
    'mirror image',
    'flip photo online',
    'flip image horizontally',
    'flip image vertically',
    'mirror photo',
  ],
  breadcrumbs: [
    { name: 'Home', path: '/' },
    { name: 'All Tools', path: '/tools' },
    { name: 'Flip Image', path: '/flip-image' },
  ],
  heading: 'Flip and Mirror Images',
  lead: 'Mirror a picture left-to-right or top-to-bottom with one click. The preview flips instantly, so you can see the result before you export it.',
  howItWorksTitle: 'How to flip an image',
  features: [
    'Horizontal (left-to-right) mirroring',
    'Vertical (top-to-bottom) mirroring',
    'Both at once, equivalent to a 180° turn',
    'Live preview',
    'Any output format and quality',
  ],
  steps: [
    {
      title: 'Add your image',
      body: 'Drop in a JPG, PNG or WebP file. Nothing is uploaded — the file is read straight into your browser.',
    },
    {
      title: 'Choose a direction',
      body: 'Flip horizontally to mirror left and right, vertically to mirror top and bottom, or both for a 180° turn.',
    },
    {
      title: 'Check the preview',
      body: 'The preview mirrors immediately using the same transform the export will apply.',
    },
    {
      title: 'Download',
      body: 'Export in the original format or convert as you go, then save the flipped copy.',
    },
  ],
  benefitsTitle: 'Why flip an image?',
  benefits: [
    {
      icon: 'flip-horizontal',
      title: 'Fix mirrored selfies',
      body: 'Front cameras often save the preview you saw rather than the scene as others see it, leaving text backwards. One horizontal flip corrects it.',
    },
    {
      icon: 'image',
      title: 'Correct scanned film',
      body: 'Negatives and slides fed into a scanner the wrong way round come out mirrored. Flipping restores the correct orientation.',
    },
    {
      icon: 'sparkles',
      title: 'Improve composition',
      body: 'Mirroring changes which way a subject faces, which can balance a layout or make a subject look into a page rather than off it.',
    },
    {
      icon: 'bolt',
      title: 'Lossless geometry',
      body: 'A flip rearranges whole pixels rather than resampling them, so no detail is lost in the transformation itself.',
    },
    {
      icon: 'shield',
      title: 'Private by design',
      body: 'The mirroring happens in your browser. No copy of your picture is sent anywhere.',
    },
    {
      icon: 'device',
      title: 'No app needed',
      body: 'Works on a phone, tablet or desktop in any modern browser, with nothing to install.',
    },
  ],
  faqs: [
    {
      question: 'What is the difference between flipping and rotating?',
      answer:
        'Rotating turns an image around its centre, so the content stays the same way round. Flipping mirrors it, producing a reversed image — text reads backwards and anything asymmetric swaps sides. Flipping both horizontally and vertically gives the same result as a 180° rotation.',
    },
    {
      question: 'Does flipping an image lose quality?',
      answer:
        'The flip itself is lossless: pixels are reordered, not recalculated. Any quality change comes from re-encoding the file afterwards, so choose PNG or a high quality setting if you want the pixels preserved exactly.',
    },
    {
      question: 'Why does my selfie have backwards text?',
      answer:
        'Many phones save the mirrored preview you saw on screen rather than the scene as the camera recorded it. That makes any writing in the shot read backwards. Flipping horizontally puts it right.',
    },
    {
      question: 'Can I flip and rotate at the same time?',
      answer:
        'Use the rotation tool for turning and this one for mirroring — or the cropper, which offers rotation, both flips and a crop box in a single step.',
    },
    {
      question: 'Is transparency preserved when flipping?',
      answer:
        'Yes. A transparent PNG or WebP keeps its alpha channel exactly. Exporting to JPEG flattens transparency onto a colour you choose, because JPEG has no alpha channel.',
    },
  ],
  prose: [
    {
      title: 'When mirroring is the right fix',
      paragraphs: [
        'Mirroring is most often a correction rather than a creative choice. Front-facing cameras, document scanners fed a negative the wrong way round, and some screen-recording tools all produce reversed output, and the giveaway is always text: if writing in the frame reads backwards, the image is mirrored.',
        'It is worth being deliberate about it, though. A mirrored photograph of a real place is, strictly speaking, inaccurate — shop signs, number plates and the side of the road all end up wrong. For journalism or documentation, rotate and crop instead.',
        'Used as a composition tool it is genuinely useful. Readers scan a page in the direction their language runs, and a subject facing into that direction feels settled while one facing out of it feels like it is leaving. Flipping is the cheapest way to test which reads better.',
      ],
    },
  ],
};
