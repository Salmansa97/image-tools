import { ToolPageContent } from '../../seo/seo.models';

export const ROTATE_CONTENT: ToolPageContent = {
  toolId: 'rotate',
  path: '/rotate-image',
  seoTitle: 'Rotate Image Online — Free Image Rotator & Straightener | ImageTools',
  seoDescription:
    'Rotate images online for free. Turn a picture 90°, 180° or by any angle to straighten a crooked horizon, with the canvas expanded so nothing is cut off.',
  keywords: [
    'rotate image',
    'image rotator',
    'rotate photo online',
    'straighten image',
    'rotate jpg',
    'rotate png',
  ],
  breadcrumbs: [
    { name: 'Home', path: '/' },
    { name: 'All Tools', path: '/tools' },
    { name: 'Rotate Image', path: '/rotate-image' },
  ],
  heading: 'Rotate and Straighten Images',
  lead: 'Turn a picture in quarter steps, or nudge it a fraction of a degree to level a crooked horizon. The canvas grows to fit, so corners are never clipped.',
  howItWorksTitle: 'How to rotate an image',
  features: [
    'Quarter-turn buttons for 90°, 180° and 270°',
    'Fine angle slider for straightening',
    'Canvas expanded so nothing is cropped',
    'Transparent or coloured corners',
    'Live preview before you commit',
  ],
  steps: [
    {
      title: 'Open your image',
      body: 'Drop in a JPG, PNG or WebP file. The preview turns with every adjustment you make.',
    },
    {
      title: 'Turn it',
      body: 'Use the quarter-turn buttons for a sideways phone photo, or drag the fine slider to straighten a horizon by a degree or two.',
    },
    {
      title: 'Choose what fills the corners',
      body: 'A free rotation exposes triangles at the edges. Keep them transparent for PNG and WebP, or pick a colour that matches your layout.',
    },
    {
      title: 'Save the result',
      body: 'Press Rotate, check the output, and download. Your original file is never modified.',
    },
  ],
  benefitsTitle: 'Why rotate here?',
  benefits: [
    {
      icon: 'rotate-right',
      title: 'Any angle, not just 90°',
      body: 'Most free tools only offer quarter turns. A one-degree correction is exactly what a crooked horizon usually needs.',
    },
    {
      icon: 'crop',
      title: 'Nothing gets clipped',
      body: 'Rotating a rectangle makes its bounding box larger. The canvas is expanded to match, so the corners of your picture survive.',
    },
    {
      icon: 'image',
      title: 'Transparency preserved',
      body: 'Rotate a transparent PNG and the exposed corners stay transparent, rather than being filled with unexpected black or white.',
    },
    {
      icon: 'bolt',
      title: 'Instant preview',
      body: 'The preview turns as you drag, using the same transform the export will apply, so there are no surprises when you download.',
    },
    {
      icon: 'shield',
      title: 'Processed privately',
      body: 'Rotation happens on your device using the browser canvas. Nothing is uploaded, which matters for documents and ID scans.',
    },
    {
      icon: 'device',
      title: 'Works on a phone',
      body: 'Fix a sideways photo on the same device you took it with, without installing anything.',
    },
  ],
  faqs: [
    {
      question: 'Does rotating an image reduce its quality?',
      answer:
        'A 90°, 180° or 270° turn rearranges pixels without altering them, so the only quality change comes from re-encoding — choose PNG or a high quality setting to avoid even that. A free angle has to resample the image, which softens it very slightly, in the same way any rotation in a photo editor does.',
    },
    {
      question: 'Why does my image get bigger after rotating it?',
      answer:
        'Rotating a rectangle by anything other than a quarter turn makes its bounding box larger — a 1000 × 600 image rotated 45° needs roughly 1131 × 1131 pixels to contain it. We expand the canvas rather than cropping your picture, and fill the exposed corners with transparency or a colour you choose.',
    },
    {
      question: 'How do I straighten a crooked photo?',
      answer:
        'Use the fine angle slider rather than the quarter-turn buttons. Most crooked horizons need between one and three degrees. Rotate first, then use the cropper to trim away the exposed corners if you want a clean rectangle.',
    },
    {
      question: 'Will this fix a photo that appears sideways on my computer?',
      answer:
        'Yes. Sideways photos are usually upright files carrying an EXIF orientation flag that some software ignores. Rotating here bakes the correct orientation into the pixels themselves, so every program shows it the right way up.',
    },
    {
      question: 'Can I rotate several images at once?',
      answer:
        'This tool works on one image at a time so you can judge each angle. For batches where every image needs the same quarter turn, rotate one, check the result, and repeat — each pass takes a couple of seconds.',
    },
  ],
  prose: [
    {
      title: 'Rotation, orientation and EXIF',
      paragraphs: [
        'Digital cameras and phones almost never rotate the pixels when you turn the device. They record the image as the sensor saw it and add an EXIF orientation flag saying which way up it should be displayed. Software that honours the flag shows it correctly; software that ignores it shows it on its side.',
        'That is why a photograph can look fine in one program and sideways in another. Rotating it here resolves the ambiguity permanently: the pixels themselves are rearranged and the result carries no orientation flag to misinterpret.',
        'If you are straightening rather than turning, work in small steps. Draw an imaginary line along a horizon or a building edge and adjust until it is level; one or two degrees is usually enough, and larger corrections cost you more of the frame once the exposed corners are cropped away.',
      ],
    },
  ],
};
