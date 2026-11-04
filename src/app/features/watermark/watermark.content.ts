import { ToolPageContent } from '../../seo/seo.models';

export const WATERMARK_CONTENT: ToolPageContent = {
  toolId: 'watermark',
  path: '/watermark-image',
  seoTitle: 'Add Watermark to Image Online — Free Text & Logo Watermark Maker | ImageTools',
  seoDescription:
    'Add a text or logo watermark to your images for free. Control position, size, angle, opacity and tiling, apply it to a whole batch, and download as a ZIP.',
  keywords: [
    'add watermark to image',
    'watermark maker',
    'text watermark',
    'logo watermark',
    'watermark photos online',
    'batch watermark',
  ],
  breadcrumbs: [
    { name: 'Home', path: '/' },
    { name: 'All Tools', path: '/tools' },
    { name: 'Add Watermark', path: '/watermark-image' },
  ],
  heading: 'Add a Watermark to Your Images',
  lead: 'Stamp your name or your logo across a photograph — once in a corner, or tiled over the whole frame. Set it up on one image, then apply it to the entire batch.',
  howItWorksTitle: 'How to watermark an image',
  features: [
    'Text or logo watermarks',
    'Nine anchor positions, or tiled across the image',
    'Adjustable size, angle, opacity and colour',
    'Bulk application across many images',
    'ZIP download of the whole batch',
  ],
  steps: [
    {
      title: 'Add your images',
      body: 'Drop in one picture or a hundred. The first is used for the live preview; the settings apply to all of them.',
    },
    {
      title: 'Choose text or a logo',
      body: 'Type the text you want, or upload a PNG logo — a transparent one sits on the photograph far more cleanly.',
    },
    {
      title: 'Place and style it',
      body: 'Pick a corner, set the size relative to the image, choose an angle and opacity, or tile the mark across the whole frame.',
    },
    {
      title: 'Apply and download',
      body: 'Watermark every loaded image in one pass, then save them individually or as a single ZIP.',
    },
  ],
  benefitsTitle: 'A watermark tool that scales',
  benefits: [
    {
      icon: 'stamp',
      title: 'Size that follows the image',
      body: 'The mark is sized as a percentage of the shortest edge, so it looks the same on a 600-pixel thumbnail and a 6,000-pixel original.',
    },
    {
      icon: 'grid',
      title: 'Tiling for real protection',
      body: 'A corner mark is trivial to crop out. Tiled across the frame at low opacity, a watermark is far harder to remove without ruining the picture.',
    },
    {
      icon: 'image',
      title: 'Logo or text',
      body: 'Use a transparent PNG of your logo, or set type in a serif, sans, monospace or heavy display face with a drop shadow for legibility.',
    },
    {
      icon: 'bolt',
      title: 'Batch in one pass',
      body: 'Set the watermark up once, then apply it to every image you loaded, processed in parallel across background threads.',
    },
    {
      icon: 'shield',
      title: 'Your work stays yours',
      body: 'Uploading unwatermarked originals to a website to have them watermarked rather defeats the point. Here nothing is uploaded at all.',
    },
    {
      icon: 'lock',
      title: 'No service branding',
      body: 'The only mark on your image is the one you added. No tool logo, no "made with" footer, no paid tier to remove it.',
    },
  ],
  faqs: [
    {
      question: 'What makes a good watermark?',
      answer:
        'Visible enough to deter casual reuse, discreet enough not to ruin the picture. Around 30–50% opacity over a mid-tone area usually works. If deterrence matters more than appearance, tile the mark diagonally across the frame — a single corner mark takes seconds to crop away.',
    },
    {
      question: 'Should I use text or a logo?',
      answer:
        'Text is faster and always legible. A logo is stronger branding, provided it is a PNG with a transparent background — a logo on a white rectangle looks like a sticker. Both scale with the image here, so neither will be the wrong size on a different photograph.',
    },
    {
      question: 'Can I watermark many images at once?',
      answer:
        'Yes. Add as many as you like, set the watermark up using the preview, then apply it to the whole batch in one pass and download the results as a ZIP.',
    },
    {
      question: 'Does watermarking reduce image quality?',
      answer:
        'The watermark is drawn onto the image and the result re-encoded, so quality depends on the format and quality setting you choose. At 90% or above the difference is invisible. PNG output is lossless.',
    },
    {
      question: 'Can a watermark be removed?',
      answer:
        'Any watermark can be removed with enough effort — the honest answer is that it raises the cost rather than making theft impossible. A tiled, semi-transparent mark across the subject is far more effort to remove than one in a corner, which is usually enough to deter casual copying.',
    },
  ],
  prose: [
    {
      title: 'Watermarking without ruining the photograph',
      paragraphs: [
        'The tension in watermarking is always the same: a mark that protects the image well is a mark that damages it. Where you land depends on what the image is for. A portfolio piece meant to attract clients should be barely marked; a proof sent to a client before payment can be tiled heavily.',
        'Placement matters more than size. A watermark over a busy area of the photograph is both less noticeable and harder to clone out than one sitting on flat sky. The rule-of-thirds intersections are usually a reasonable compromise between visibility and intrusion.',
        'Keep opacity low and contrast high. A white mark at 35% opacity with a soft shadow stays legible over both light and dark areas, whereas a solid black mark disappears into shadows and shouts over highlights. The shadow option here exists for exactly that reason.',
      ],
    },
  ],
};
