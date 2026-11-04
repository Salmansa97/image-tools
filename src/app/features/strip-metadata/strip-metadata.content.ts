import { ToolPageContent } from '../../seo/seo.models';

export const STRIP_METADATA_CONTENT: ToolPageContent = {
  toolId: 'strip',
  path: '/remove-metadata',
  seoTitle: 'Remove EXIF Data from Images — Free Metadata Remover Online | ImageTools',
  seoDescription:
    'Remove EXIF, GPS and XMP metadata from your photos for free. Strip location data before sharing, in bulk, with nothing uploaded to any server.',
  keywords: [
    'remove exif data',
    'metadata remover',
    'strip exif',
    'remove gps from photo',
    'delete image metadata',
    'anonymise photo',
  ],
  breadcrumbs: [
    { name: 'Home', path: '/' },
    { name: 'All Tools', path: '/tools' },
    { name: 'Remove Metadata', path: '/remove-metadata' },
  ],
  heading: 'Remove Metadata from Images',
  lead: 'Strip EXIF, GPS, XMP and colour-profile data out of your photographs before you share them. Add a whole folder, clean them in one pass, and download the results as a ZIP.',
  howItWorksTitle: 'How to remove image metadata',
  features: [
    'Removes EXIF, GPS, XMP and ICC data',
    'Bulk processing with per-file progress',
    'Shows what each file was carrying',
    'Keeps the visible image identical',
    'ZIP download for the whole batch',
  ],
  steps: [
    {
      title: 'Add your photos',
      body: 'Drop in one image or hundreds. Each is scanned so you can see what it is carrying before anything changes.',
    },
    {
      title: 'Review what is there',
      body: 'Files with GPS coordinates are flagged. That is usually the data people most want gone.',
    },
    {
      title: 'Strip it',
      body: 'Each image is decoded and re-encoded from its pixels alone, which leaves no room for metadata to survive.',
    },
    {
      title: 'Download the clean copies',
      body: 'Save them individually or as a ZIP. Your originals on disk are untouched.',
    },
  ],
  benefitsTitle: 'Why strip metadata?',
  benefits: [
    {
      icon: 'map-pin',
      title: 'Remove your location',
      body: 'Phone photos usually carry GPS coordinates accurate to a few metres. Posting one from home publishes your address to anyone who checks.',
    },
    {
      icon: 'shield',
      title: 'Genuinely private',
      body: 'Uploading a photo to a website in order to remove its location data hands over that very data. Here nothing is transmitted at all.',
    },
    {
      icon: 'eye',
      title: 'See it before and after',
      body: 'Each file shows what it was carrying, so you know the stripping actually did something.',
    },
    {
      icon: 'compress',
      title: 'Smaller files, too',
      body: 'Metadata and embedded thumbnails can account for tens of kilobytes per image, which is removed along with the rest.',
    },
    {
      icon: 'bolt',
      title: 'Whole folders at once',
      body: 'Clean an entire album in one pass, with progress for every file and a single ZIP at the end.',
    },
    {
      icon: 'image',
      title: 'Pixels untouched',
      body: 'At the highest quality setting the visible image is preserved; only the invisible baggage is dropped.',
    },
  ],
  faqs: [
    {
      question: 'How does removing metadata work?',
      answer:
        'The image is decoded to raw pixels and re-encoded as a brand-new file. Metadata lives in container blocks alongside the pixel data, so a file rebuilt from pixels alone simply has nowhere for it to be. That is why this approach removes everything rather than only the fields a tool happens to know about.',
    },
    {
      question: 'Will this change how my photo looks?',
      answer:
        'Re-encoding is a lossy step for JPEG and WebP, so use a high quality setting — 95 or above is visually identical. Choosing PNG output is lossless, though the file will be much larger. The dimensions and content never change.',
    },
    {
      question: 'What exactly gets removed?',
      answer:
        'Everything outside the pixels: EXIF (camera, lens, exposure, timestamps, GPS), XMP, IPTC, embedded thumbnails, colour profiles and any maker notes. If you need to keep a colour profile for print work, this is not the right tool.',
    },
    {
      question: 'Do I need to do this if I post to social media?',
      answer:
        'Major platforms strip metadata on upload, so for those it is belt and braces. It matters for files sent by email or messaging, shared through cloud storage, or uploaded to a site you run — those usually keep EXIF intact.',
    },
    {
      question: 'Can the removal be undone?',
      answer:
        'No. The downloaded copy genuinely has no metadata, and there is no way to recover it from that file. Your original is untouched on disk, so keep it if the information matters to you.',
    },
  ],
  prose: [
    {
      title: 'What you are actually removing',
      paragraphs: [
        'A photograph straight from a phone is two things: the picture, and a detailed record of the circumstances in which it was taken. The second part includes the device, its settings, the exact timestamp, and — unless location access was denied — coordinates precise enough to identify a building.',
        'Stripping is a blunt instrument, and that is its strength. Rather than deleting the fields a tool recognises and leaving whatever it does not, rebuilding the file from pixels alone guarantees that nothing in the original container survives, including proprietary maker notes.',
        'The cost is that you lose the useful parts too. Photographers who want to review their settings, or who rely on timestamps to sort an archive, should keep the originals and strip only the copies they publish. The clean copy is for sharing; the original stays home.',
      ],
    },
  ],
};
