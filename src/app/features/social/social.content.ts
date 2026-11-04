import { ToolPageContent } from '../../seo/seo.models';

export const SOCIAL_CONTENT: ToolPageContent = {
  toolId: 'social',
  path: '/social-media-image-resizer',
  seoTitle: 'Social Media Image Resizer — Free Instagram, Facebook & X Sizes | ImageTools',
  seoDescription:
    'Resize one image for every social platform at once. Correct dimensions for Instagram, Facebook, X, LinkedIn, YouTube and Pinterest, cropped or padded, free and private.',
  keywords: [
    'social media image resizer',
    'instagram image size',
    'facebook cover size',
    'youtube thumbnail size',
    'twitter header size',
    'social media image dimensions',
  ],
  breadcrumbs: [
    { name: 'Home', path: '/' },
    { name: 'All Tools', path: '/tools' },
    { name: 'Social Media Resizer', path: '/social-media-image-resizer' },
  ],
  heading: 'Social Media Image Resizer',
  lead: 'One upload, every size you need. Produce correctly dimensioned images for Instagram, Facebook, X, LinkedIn, YouTube and Pinterest in a single pass, then download them as a ZIP.',
  howItWorksTitle: 'How to resize for social media',
  features: [
    'Fourteen current platform sizes',
    'Crop to fill or pad to fit',
    'Select by platform or individually',
    'All sizes generated in one pass',
    'ZIP download with descriptive file names',
  ],
  steps: [
    {
      title: 'Upload your image',
      body: 'Start from the largest version you have — every output is downscaled from it, and downscaling is far kinder than upscaling.',
    },
    {
      title: 'Choose your platforms',
      body: 'Tick whole platforms or individual sizes. Each one shows its exact dimensions and what it is used for.',
    },
    {
      title: 'Decide how to fit',
      body: 'Fill crops to the exact ratio and loses the edges; Fit pads with a colour and keeps everything. Portraits usually want Fill, product shots Fit.',
    },
    {
      title: 'Generate and download',
      body: 'Every size is rendered at once and named after its platform, so the ZIP is ready to use straight away.',
    },
  ],
  benefitsTitle: 'Why size images properly?',
  benefits: [
    {
      icon: 'share',
      title: 'Current dimensions',
      body: 'Platform sizes drift. These are the dimensions in use now, with a note on what each is for, so nothing arrives awkwardly cropped.',
    },
    {
      icon: 'crop',
      title: 'Crop or pad, your choice',
      body: 'Filling crops to the exact ratio; fitting pads with a colour you pick. Both centre the subject rather than cutting from one edge.',
    },
    {
      icon: 'image',
      title: 'Sharp downscaling',
      body: 'Each output is reduced in halving steps rather than one jump, which keeps faces and text crisp at small sizes.',
    },
    {
      icon: 'zip',
      title: 'Named for their purpose',
      body: 'Files come out as instagram-square-1080x1080.jpg rather than a folder of numbers, so you know which is which.',
    },
    {
      icon: 'bolt',
      title: 'All sizes at once',
      body: 'Fourteen renders take seconds, spread across background threads, instead of fourteen trips through a resizer.',
    },
    {
      icon: 'shield',
      title: 'Processed privately',
      body: 'Campaign images and unreleased product shots never leave your device.',
    },
  ],
  faqs: [
    {
      question: 'What size should an Instagram post be?',
      answer:
        'Square posts are 1080 × 1080 pixels, portrait posts 1080 × 1350, and stories and reels 1080 × 1920. Portrait takes up the most space in the feed, which is why many accounts default to it.',
    },
    {
      question: 'What is the right size for a YouTube thumbnail?',
      answer:
        '1280 × 720 pixels, the 16:9 ratio video uses. YouTube accepts larger images and scales them down, but starting at the exact size gives you control over how text and faces are cropped.',
    },
    {
      question: 'Should I crop or pad my image?',
      answer:
        'Crop when the subject is central and the edges are expendable — portraits, landscapes, most photographs. Pad when nothing can be lost, such as a product shot, a poster or a graphic with text near the border. Padding adds a visible band, so choose a colour that suits the design.',
    },
    {
      question: 'Why do my images look blurry on social media?',
      answer:
        'Usually because the platform re-compressed an image that was the wrong size. Uploading at the exact dimensions means less re-processing. Avoid uploading something smaller than the target, since upscaling cannot invent detail.',
    },
    {
      question: 'Can I use one image for every platform?',
      answer:
        'You can generate every size from one source here, but think about the ratios. An image framed for a 16:9 banner will lose a great deal when cropped to a 9:16 story. For a campaign that spans both, shoot or design with the extremes in mind and check the Fill previews.',
    },
  ],
  prose: [
    {
      title: 'Designing for several ratios at once',
      paragraphs: [
        'The hard part of social imagery is not resizing, it is that the same picture has to work as a square, a tall rectangle and a wide banner. A composition that is perfect in one is often ruined in another, because cropping to a different ratio always removes something.',
        'The practical answer is to design for the most extreme ratio you need and keep the important content inside a "safe area" that survives every other crop. For a set spanning 9:16 stories and 16:9 banners, that safe area is roughly the central square.',
        'It is also worth remembering where these images are seen. Feed images are usually viewed at a few hundred pixels on a phone, so fine detail and small text disappear regardless of the file you upload. Large, high-contrast elements survive the trip; delicate ones do not.',
      ],
    },
  ],
};
