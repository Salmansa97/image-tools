import { ToolPageContent } from '../../seo/seo.models';

export const METADATA_CONTENT: ToolPageContent = {
  toolId: 'metadata',
  path: '/image-metadata-viewer',
  seoTitle: 'Image Metadata Viewer — Free EXIF & GPS Data Reader Online | ImageTools',
  seoDescription:
    'View the EXIF metadata hidden in your photos — camera, lens, exposure, timestamps and GPS coordinates. Read entirely in your browser, with nothing uploaded.',
  keywords: [
    'exif viewer',
    'image metadata viewer',
    'photo metadata',
    'exif data reader',
    'check photo gps',
    'view image properties',
  ],
  breadcrumbs: [
    { name: 'Home', path: '/' },
    { name: 'All Tools', path: '/tools' },
    { name: 'Metadata Viewer', path: '/image-metadata-viewer' },
  ],
  heading: 'Image Metadata Viewer',
  lead: 'See everything your photograph is carrying: camera and lens, exposure settings, timestamps, software history — and the GPS coordinates most people have no idea are in there.',
  howItWorksTitle: 'How to view image metadata',
  features: [
    'Full EXIF read for JPEG, PNG and WebP',
    'GPS coordinates with a map link',
    'Camera, lens and exposure details',
    'PNG text chunks and XMP detection',
    'Nothing uploaded — parsed in your browser',
  ],
  steps: [
    {
      title: 'Add a photograph',
      body: 'Drop in a JPG, PNG or WebP file. Only its bytes are read; the file is never sent anywhere.',
    },
    {
      title: 'Read the summary',
      body: 'Dimensions, format and encoding appear first, followed by camera and capture settings if the file carries them.',
    },
    {
      title: 'Check for location data',
      body: 'If GPS coordinates are present they are shown prominently, with a link to see the spot on a map.',
    },
    {
      title: 'Strip it if you need to',
      body: 'One link takes you to the metadata remover, which re-encodes the image without any of it.',
    },
  ],
  benefitsTitle: 'Why look at metadata?',
  benefits: [
    {
      icon: 'map-pin',
      title: 'Find hidden location data',
      body: 'Phones embed GPS coordinates by default. A photograph posted publicly can reveal a home address to anyone who checks.',
    },
    {
      icon: 'eye',
      title: 'Learn from the settings',
      body: 'Shutter speed, aperture, ISO and focal length are all recorded. Reviewing them against the result is one of the fastest ways to improve.',
    },
    {
      icon: 'info',
      title: 'Verify a file’s history',
      body: 'Software fields and timestamps show whether an image has been through an editor and when it was first captured.',
    },
    {
      icon: 'shield',
      title: 'Parsed locally',
      body: 'Other EXIF viewers require an upload — which means handing over the very location data you are checking for. This one reads the bytes in your browser.',
    },
    {
      icon: 'image',
      title: 'More than JPEG',
      body: 'PNG text chunks and WebP EXIF and XMP blocks are read too, not just JPEG APP segments.',
    },
    {
      icon: 'bolt',
      title: 'Instant',
      body: 'Only the file header is parsed, so results appear immediately even for very large photographs.',
    },
  ],
  faqs: [
    {
      question: 'What is EXIF data?',
      answer:
        'EXIF (Exchangeable Image File Format) is a block of information cameras and phones write into a photograph: the make and model, lens, shutter speed, aperture, ISO, orientation, the date and time, and often the GPS coordinates. It travels with the file wherever it goes.',
    },
    {
      question: 'Do photos contain my location?',
      answer:
        'Often, yes. Most phones record GPS coordinates by default unless location access has been denied to the camera. This tool shows you immediately whether a given file carries them, accurate to a few metres.',
    },
    {
      question: 'Do social networks remove EXIF data?',
      answer:
        'Most major platforms strip it when you upload. That does not help with files you send by email or messaging apps, share in cloud storage, or upload to a website you run yourself — those usually keep it intact.',
    },
    {
      question: 'Why does my image show no metadata?',
      answer:
        'Either it never had any — screenshots and generated graphics usually do not — or it has already been stripped, by a social platform, an editor exporting "for web", or a tool like our metadata remover.',
    },
    {
      question: 'Is my photo uploaded to read its metadata?',
      answer:
        'No. The file is read into your browser’s memory and parsed there with JavaScript. You can confirm it by disconnecting from the internet after the page loads — the viewer keeps working.',
    },
  ],
  prose: [
    {
      title: 'What a photograph tells people',
      paragraphs: [
        'A single photograph straight from a phone typically records the exact coordinates where it was taken, the precise second, the device model, and often a serial number. Several photographs together map out a routine: where someone lives, when they are usually home, which school their children attend.',
        'None of this is visible when you look at the picture, which is what makes it easy to overlook. The file simply carries it, and anyone who downloads the image can read it with a tool like this one in seconds.',
        'That is not an argument for stripping everything. Photographers rely on EXIF to review settings, archives depend on timestamps, and location data makes a travel library searchable. The point is to decide deliberately: keep it for files you control, and strip it for anything you publish or send to someone you do not know.',
      ],
    },
  ],
};
