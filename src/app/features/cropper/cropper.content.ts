import { ToolPageContent } from '../../seo/seo.models';

export const CROPPER_CONTENT: ToolPageContent = {
  toolId: 'crop',
  path: '/crop-image',
  seoTitle: 'Crop Image Online — Free Image Cropper with Aspect Ratios | ImageTools',
  seoDescription:
    'Crop images online for free. Drag an interactive crop box, lock it to 1:1, 4:3, 16:9, 3:2 or 9:16, then zoom, rotate and flip — all processed privately in your browser.',
  keywords: [
    'crop image',
    'image cropper',
    'crop photo online',
    'crop to square',
    'crop 16:9',
    'rotate and flip image',
  ],
  breadcrumbs: [
    { name: 'Home', path: '/' },
    { name: 'Crop Image', path: '/crop-image' },
  ],
  heading: 'Crop Images Exactly How You Want',
  lead: 'Drag a crop box across your picture and fine-tune it with handles, guides and the arrow keys. Lock a ratio for profile pictures or video thumbnails, and rotate or flip before you export.',
  howItWorksTitle: 'How to crop an image',
  features: [
    'Interactive drag-and-resize crop box',
    'Free, 1:1, 4:3, 16:9, 3:2 and 9:16 ratios',
    'Zoom for pixel-precise framing',
    'Rotate in 90° steps and flip both ways',
    'Live preview of the cropped result',
  ],
  steps: [
    {
      title: 'Load your picture',
      body: 'Drop a JPG, PNG or WebP file onto the page. The crop box starts covering the whole image.',
    },
    {
      title: 'Choose a ratio',
      body: 'Pick Free to crop by eye, or lock 1:1 for avatars, 16:9 for thumbnails and 9:16 for stories. The box keeps that shape as you drag.',
    },
    {
      title: 'Frame the shot',
      body: 'Drag the box, pull its handles, and zoom in for precision. Rotate in quarter turns or flip horizontally and vertically if the orientation is wrong.',
    },
    {
      title: 'Export the crop',
      body: 'Preview the result, choose a format and quality, then download. The original file on your device is never modified.',
    },
  ],
  benefitsTitle: 'A cropper built for precision',
  benefits: [
    {
      icon: 'crop',
      title: 'Ratio locks that hold',
      body: 'Choose a ratio and every drag, resize and nudge respects it. No more avatars that are one pixel off square.',
    },
    {
      icon: 'zoom-in',
      title: 'Zoom where it matters',
      body: 'Magnify the view and it follows your selection instead of wandering off, so you can trim a few pixels at a time.',
    },
    {
      icon: 'rotate-right',
      title: 'Rotate and flip first',
      body: 'Straighten a sideways phone photo or mirror a scan before cropping — the crop box follows the new orientation automatically.',
    },
    {
      icon: 'device',
      title: 'Touch and keyboard friendly',
      body: 'Drag with a finger on a phone, or tab to the crop box and nudge it with the arrow keys. Both paths do exactly the same thing.',
    },
    {
      icon: 'image',
      title: 'Full original resolution',
      body: 'The crop is applied to the full-size image, not to the on-screen preview, so you keep every pixel inside the box.',
    },
    {
      icon: 'shield',
      title: 'Nothing leaves your device',
      body: 'Personal photos, ID scans, screenshots of private documents — none of it is uploaded, because the cropping happens locally.',
    },
  ],
  faqs: [
    {
      question: 'Does cropping reduce the quality of my image?',
      answer:
        'Cropping itself removes pixels from the edges without touching the ones you keep. Any quality change comes from re-encoding, so choose PNG or a high quality setting if you want the kept area to stay pixel-perfect.',
    },
    {
      question: 'How do I crop a picture to a perfect square?',
      answer:
        'Select the 1:1 ratio before you drag. The crop box is then constrained to a square no matter which handle you pull, which is exactly what profile pictures on most platforms expect.',
    },
    {
      question: 'What aspect ratio should I use?',
      answer:
        'Use 1:1 for avatars and square social posts, 16:9 for video thumbnails and widescreen banners, 4:3 for classic photo prints, 3:2 for standard camera output, and 9:16 for vertical stories and reels.',
    },
    {
      question: 'Can I rotate an image without cropping it?',
      answer:
        'Yes. Rotate or flip the picture, leave the crop box covering everything, and export. You will get the same image in a new orientation.',
    },
    {
      question: 'Is there a maximum image size?',
      answer:
        'Files up to 50 MB are accepted. Very large images are additionally limited by what your browser can hold in a canvas — around 16,384 pixels on a side — and the tool scales the output down automatically if a crop would exceed it.',
    },
  ],
  prose: [
    {
      title: 'Cropping with intent',
      paragraphs: [
        'A crop is the cheapest edit available and usually the most powerful. Removing a distracting edge, tightening the space around a subject, or simply straightening a horizon will improve a photograph more than any filter.',
        'The faint grid over the crop box divides it into thirds. Placing your subject along one of those lines, rather than dead centre, is a long-standing compositional guide — not a rule, but a useful starting point when a picture feels unbalanced.',
        'Think about where the image will end up before you commit. A banner that will be displayed at 16:9 should be cropped to 16:9 here, rather than cropped loosely and squeezed later by whatever software displays it. Cropping to the final shape yourself is the only way to control which parts survive.',
      ],
    },
  ],
};
