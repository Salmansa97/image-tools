import { SupportedMimeType } from '../../core/models/image.models';
import { ToolPageContent } from '../../seo/seo.models';

/**
 * A converter route.
 *
 * All four conversion pages share one tool. The preset decides which format is
 * selected on arrival and supplies that page's own copy, so `/png-to-jpg` answers
 * a specific search intent rather than being a near-duplicate of `/convert-image`.
 */
export interface ConverterPreset {
  readonly content: ToolPageContent;
  readonly defaultTarget: SupportedMimeType;
  /** Shown above the uploader to set expectations about the input. */
  readonly inputHint: string;
}

export const CONVERTER_CONTENT: ToolPageContent = {
  toolId: 'convert',
  path: '/convert-image',
  seoTitle: 'Convert Image Online — Free JPG, PNG & WebP Converter | ImageTools',
  seoDescription:
    'Convert images between JPG, PNG and WebP for free. Bulk convert whole folders, keep transparency where the format allows it, and download everything as a ZIP — no uploads.',
  keywords: [
    'convert image',
    'image converter',
    'jpg to png',
    'png to webp',
    'webp to jpg',
    'bulk image conversion',
  ],
  breadcrumbs: [
    { name: 'Home', path: '/' },
    { name: 'Convert Image', path: '/convert-image' },
  ],
  heading: 'Convert Images Between JPG, PNG and WebP',
  lead: 'Drop in a single picture or a whole folder, choose a target format, and convert everything at once. Transparency is preserved wherever the destination format supports it.',
  howItWorksTitle: 'How to convert an image',
  features: [
    'Bulk conversion with progress per file',
    'JPG, PNG and WebP in every direction',
    'Automatic source-format detection',
    'Transparency preserved or flattened on your terms',
    'Download everything as a ZIP',
  ],
  steps: [
    {
      title: 'Add your files',
      body: 'Drag in as many JPG, PNG or WebP images as you like. The original format of each one is detected and displayed.',
    },
    {
      title: 'Pick the target format',
      body: 'Choose JPG for compatibility, PNG for lossless transparency, or WebP for the smallest files on the modern web.',
    },
    {
      title: 'Convert',
      body: 'Conversion runs across several background threads at once. You can watch each file progress and cancel at any point.',
    },
    {
      title: 'Download',
      body: 'Save converted images one at a time, or take the whole batch as a single ZIP archive.',
    },
  ],
  benefitsTitle: 'Why convert here?',
  benefits: [
    {
      icon: 'convert',
      title: 'Every direction supported',
      body: 'PNG to JPG, JPG to PNG, PNG to WebP, JPG to WebP, WebP to PNG and WebP to JPG — all six conversions, in one place.',
    },
    {
      icon: 'image',
      title: 'Transparency handled properly',
      body: 'Converting to PNG or WebP keeps the alpha channel. Converting to JPG warns you first and lets you choose the colour that replaces it.',
    },
    {
      icon: 'bolt',
      title: 'Built for batches',
      body: 'Conversion is spread across Web Workers, so a folder of images finishes quickly and the page never freezes while it works.',
    },
    {
      icon: 'shield',
      title: 'No uploads, ever',
      body: 'Most online converters send your files to a server. This one does not — the conversion happens in your browser, so nothing is transmitted.',
    },
    {
      icon: 'zip',
      title: 'One-click ZIP',
      body: 'Converted fifty images? Download them all in a single archive, assembled on your device.',
    },
    {
      icon: 'lock',
      title: 'Safe for sensitive images',
      body: 'Because nothing is uploaded, the tool is suitable for documents, screenshots and photographs you would never put on a stranger’s server.',
    },
  ],
  faqs: [
    {
      question: 'Which image format should I use?',
      answer:
        'Use JPG for photographs that need to work everywhere, PNG when you need transparency or pixel-exact graphics, and WebP when you control the destination and want the smallest file — it is typically 25–35% below JPEG at the same visual quality and is supported by every current browser.',
    },
    {
      question: 'Will converting lose quality?',
      answer:
        'Converting to PNG is lossless. Converting to JPG or WebP re-encodes the image, which discards some detail; at quality 90 and above the difference is essentially invisible. Converting a JPG to PNG cannot restore detail the JPEG already removed — it simply stops any further loss.',
    },
    {
      question: 'What happens to transparency when I convert to JPG?',
      answer:
        'JPEG has no alpha channel, so transparent areas must be filled with a solid colour. The tool warns you and lets you choose that colour — white by default — before converting.',
    },
    {
      question: 'How many images can I convert at once?',
      answer:
        'There is no fixed limit. Each file may be up to 50 MB, and in practice your device’s memory is the only ceiling. Progress is shown per file, and you can cancel a long batch at any time.',
    },
    {
      question: 'Do you support HEIC, AVIF, GIF or SVG?',
      answer:
        'Not currently. The tool relies on formats that every browser can both decode and encode reliably, which today means JPG, PNG and WebP. Formats the browser can decode but not encode, such as HEIC, cannot be produced as output.',
    },
  ],
  prose: [
    {
      title: 'Understanding the three formats',
      paragraphs: [
        'JPEG, introduced in 1992, is a lossy format designed for photographs. It discards detail the eye is least likely to notice, which makes it extremely efficient for continuous-tone images and poor for sharp-edged graphics, where it produces visible ringing around text and lines.',
        'PNG is lossless: what goes in comes out, pixel for pixel, and it supports a full alpha channel. That makes it the right choice for logos, screenshots, diagrams and anything with transparency — but a terrible choice for photographs, where the file can easily be ten times the size of an equivalent JPEG.',
        'WebP, now supported by every major browser, covers both cases. It has a lossy mode that beats JPEG by roughly a third at the same perceived quality, and a lossless mode with alpha that usually beats PNG. Unless you need a file that opens in decade-old software, WebP is the best default for images on the web.',
      ],
    },
  ],
};

export const PNG_TO_JPG_CONTENT: ToolPageContent = {
  toolId: 'convert',
  path: '/png-to-jpg',
  seoTitle: 'PNG to JPG Converter — Convert PNG to JPEG Free Online | ImageTools',
  seoDescription:
    'Convert PNG to JPG online for free. Choose the background colour that replaces transparency, set the quality, and convert in bulk — entirely inside your browser.',
  keywords: [
    'png to jpg',
    'png to jpeg',
    'convert png to jpg',
    'png to jpg converter',
    'change png to jpg',
  ],
  breadcrumbs: [
    { name: 'Home', path: '/' },
    { name: 'Convert Image', path: '/convert-image' },
    { name: 'PNG to JPG', path: '/png-to-jpg' },
  ],
  heading: 'PNG to JPG Converter',
  lead: 'Turn bulky PNG files into compact JPGs. Pick the colour that replaces any transparency, choose your quality, and convert a whole folder at once — without uploading a single byte.',
  howItWorksTitle: 'How to convert PNG to JPG',
  features: [
    'Bulk PNG to JPG conversion',
    'Custom background colour for transparent areas',
    'Adjustable JPEG quality',
    'Instant before-and-after file sizes',
    'ZIP download for batches',
  ],
  steps: [
    {
      title: 'Add your PNG files',
      body: 'Drag in one PNG or hundreds. Each file is checked and its original size recorded.',
    },
    {
      title: 'Choose a background colour',
      body: 'JPEG cannot store transparency, so transparent pixels need a colour. White suits most documents; match your page background for anything that will sit on a coloured surface.',
    },
    {
      title: 'Set the quality',
      body: 'Quality 85 is a good default for photographic PNGs. Screenshots with text usually want 90 or above to keep the lettering crisp.',
    },
    {
      title: 'Convert and download',
      body: 'Press Convert, then save each JPG individually or download the whole batch as a ZIP.',
    },
  ],
  benefitsTitle: 'Why convert PNG to JPG?',
  benefits: [
    {
      icon: 'compress',
      title: 'Dramatically smaller files',
      body: 'A photographic PNG converted to JPG at quality 85 is routinely five to fifteen times smaller, with no visible difference at normal viewing sizes.',
    },
    {
      icon: 'image',
      title: 'You choose the background',
      body: 'Rather than silently filling transparency with black, this converter asks. Pick white, your brand colour, or anything else.',
    },
    {
      icon: 'device',
      title: 'Universal compatibility',
      body: 'JPEG opens in every image viewer, every email client and every piece of software written in the past thirty years.',
    },
    {
      icon: 'shield',
      title: 'Private by design',
      body: 'Screenshots and scanned documents are exactly the sort of PNG you should not hand to an unknown server. Here they never leave your device.',
    },
    {
      icon: 'bolt',
      title: 'Converts in bulk',
      body: 'Point it at a folder of exports and convert the lot in one pass, with individual progress for every file.',
    },
    {
      icon: 'sparkles',
      title: 'Honest numbers',
      body: 'Every file shows its original size, its new size and the exact percentage saved, so you can see whether the trade was worth it.',
    },
  ],
  faqs: [
    {
      question: 'Why is my PNG so much larger than a JPG?',
      answer:
        'PNG stores every pixel exactly, with no loss. For a photograph, that means recording millions of subtly different colours with no shortcuts. JPEG instead approximates the image in a way the eye barely notices, which is why the same photo can be ten times smaller as a JPG.',
    },
    {
      question: 'What happens to transparency when converting PNG to JPG?',
      answer:
        'It is replaced by a solid colour, because the JPEG format has no alpha channel. This converter lets you choose that colour before converting. If you need the transparency to survive, convert to WebP instead — it is both smaller than PNG and keeps the alpha channel.',
    },
    {
      question: 'Does converting PNG to JPG reduce quality?',
      answer:
        'Yes, slightly — JPEG is a lossy format. At quality 85 to 95 the loss is imperceptible for photographs. For screenshots containing small text, use 95 or keep the file as PNG, since lossy compression blurs sharp edges.',
    },
    {
      question: 'Can I convert many PNG files at once?',
      answer:
        'Yes. Add as many as you like, convert them in a single pass, and download the results as one ZIP archive. Each file can be up to 50 MB.',
    },
    {
      question: 'Is this PNG to JPG converter really free?',
      answer:
        'Completely. There is no account, no watermark, no file limit and no paid tier. The conversion uses your own device’s processor, so there are no server costs to recoup.',
    },
  ],
  prose: [
    {
      title: 'When PNG to JPG is the right move',
      paragraphs: [
        'The clearest case is a photograph that was saved as PNG by accident — exported from a design tool, screenshotted from a camera roll, or produced by software that defaults to PNG. These files are often enormous for no benefit, and converting them to JPG is pure gain.',
        'The opposite case is worth knowing too. Logos, icons, diagrams and screenshots full of text are exactly what PNG was designed for. Converting them to JPG will add visible fringing around every sharp edge while saving comparatively little. If the file is too big, reduce its dimensions or convert to WebP instead.',
        'If you are not sure which category your image falls into, convert one and compare. Every file in the list shows its before and after size, and you can open the result to check it before downloading the rest.',
      ],
    },
  ],
};

export const JPG_TO_PNG_CONTENT: ToolPageContent = {
  toolId: 'convert',
  path: '/jpg-to-png',
  seoTitle: 'JPG to PNG Converter — Convert JPEG to PNG Free Online | ImageTools',
  seoDescription:
    'Convert JPG to PNG online for free. Get a lossless PNG ready for editing, overlays and transparency work — converted in your browser with nothing uploaded.',
  keywords: [
    'jpg to png',
    'jpeg to png',
    'convert jpg to png',
    'jpg to png converter',
    'change jpg to png',
  ],
  breadcrumbs: [
    { name: 'Home', path: '/' },
    { name: 'Convert Image', path: '/convert-image' },
    { name: 'JPG to PNG', path: '/jpg-to-png' },
  ],
  heading: 'JPG to PNG Converter',
  lead: 'Convert JPEG photos into lossless PNG files, ready for editing, layering and transparency work. Add as many as you like and convert them in one pass.',
  howItWorksTitle: 'How to convert JPG to PNG',
  features: [
    'Lossless JPG to PNG conversion',
    'Bulk conversion with per-file progress',
    'Optional palette reduction for smaller PNGs',
    'No quality loss on the converted pixels',
    'ZIP download for batches',
  ],
  steps: [
    {
      title: 'Add your JPG files',
      body: 'Drop in one photo or a whole folder of them. Formats and sizes are detected automatically.',
    },
    {
      title: 'Confirm PNG as the target',
      body: 'PNG is already selected on this page. Nothing else needs changing for a straight lossless conversion.',
    },
    {
      title: 'Convert',
      body: 'Each image is decoded and re-encoded as PNG in a background thread, so the page stays responsive even with large batches.',
    },
    {
      title: 'Download your PNGs',
      body: 'Save them individually, or take the whole set as a ZIP archive.',
    },
  ],
  benefitsTitle: 'Why convert JPG to PNG?',
  benefits: [
    {
      icon: 'image',
      title: 'No further loss',
      body: 'PNG is lossless, so once converted, every subsequent save keeps the pixels exactly as they are. Repeatedly re-saving a JPG degrades it a little each time.',
    },
    {
      icon: 'crop',
      title: 'Ready for transparency',
      body: 'PNG supports an alpha channel, so a converted file is ready to have its background removed or to be layered over other artwork.',
    },
    {
      icon: 'sparkles',
      title: 'Better for editing',
      body: 'Design tools, presentation software and print workflows all handle PNG cleanly, with no compression artefacts to fight against.',
    },
    {
      icon: 'bolt',
      title: 'Fast and parallel',
      body: 'Conversion is spread across several Web Workers, so even a large batch finishes quickly without locking the page.',
    },
    {
      icon: 'shield',
      title: 'Nothing is uploaded',
      body: 'Your photographs stay on your machine. There is no server to trust, no retention policy to read and no upload to wait for.',
    },
    {
      icon: 'compress',
      title: 'Optional size control',
      body: 'PNG files are large by nature. The quality slider reduces the colour palette, which can cut the size substantially on flat graphics.',
    },
  ],
  faqs: [
    {
      question: 'Does converting JPG to PNG improve image quality?',
      answer:
        'No, and no tool can. JPEG compression permanently discards detail when the file is first saved; converting to PNG preserves whatever survived but cannot bring back what was lost. What it does prevent is any further degradation from future saves.',
    },
    {
      question: 'Why is my PNG bigger than the original JPG?',
      answer:
        'That is expected. PNG stores every pixel exactly, so a photograph with millions of distinct colours cannot be compressed anywhere near as tightly as a lossy JPEG. A two- to ten-fold increase is normal for photographic content.',
    },
    {
      question: 'Will converting to PNG make the background transparent?',
      answer:
        'No. PNG is capable of transparency, but a JPEG has no transparency to carry over, so the converted file has a fully opaque background. Converting gives you a format that can hold transparency once you add it in an editor.',
    },
    {
      question: 'When should I convert JPG to PNG?',
      answer:
        'When the image is about to be edited repeatedly, layered over something else, or used in a workflow that requires lossless input — for example print production or a design file. For simply publishing a photograph on the web, keeping the JPG is almost always better.',
    },
    {
      question: 'Can I convert multiple JPGs at once?',
      answer:
        'Yes. Add as many files as you like and convert them all in a single pass, then download the results as one ZIP.',
    },
  ],
  prose: [
    {
      title: 'Lossy and lossless, in practice',
      paragraphs: [
        'Every time a JPEG is opened, edited and saved again, it is re-compressed, and a little more detail disappears. Do that often enough and the damage becomes obvious: blocky skies, halos around edges, muddied fine texture. This is generation loss, and it is the main reason to move to PNG partway through a workflow.',
        'Converting to PNG stops the clock. The pixels currently in the file are preserved exactly from that point on, however many times you save. The artefacts already baked in by earlier JPEG saves remain, but nothing new is added.',
        'The cost is file size. A PNG of a photograph is routinely several times larger than the JPEG it came from, which is fine for an intermediate working file and wasteful for a finished image on a web page. The usual pattern is to work in PNG and export to JPEG or WebP at the very end.',
      ],
    },
  ],
};

export const WEBP_CONVERTER_CONTENT: ToolPageContent = {
  toolId: 'convert',
  path: '/webp-converter',
  seoTitle: 'WebP Converter — Convert To and From WebP Free Online | ImageTools',
  seoDescription:
    'Free WebP converter. Turn JPG and PNG into WebP to cut page weight, or convert WebP back to JPG and PNG for older software. Runs entirely in your browser.',
  keywords: [
    'webp converter',
    'convert to webp',
    'webp to jpg',
    'webp to png',
    'png to webp',
    'jpg to webp',
  ],
  breadcrumbs: [
    { name: 'Home', path: '/' },
    { name: 'Convert Image', path: '/convert-image' },
    { name: 'WebP Converter', path: '/webp-converter' },
  ],
  heading: 'WebP Converter',
  lead: 'Convert JPG and PNG images to WebP to cut page weight by a third, or convert WebP files back to JPG and PNG when you need something older software can open.',
  howItWorksTitle: 'How to convert WebP images',
  features: [
    'JPG and PNG to WebP',
    'WebP back to JPG or PNG',
    'Transparency preserved both ways',
    'Adjustable WebP quality',
    'Bulk conversion with ZIP download',
  ],
  steps: [
    {
      title: 'Add your images',
      body: 'Drop in JPG, PNG or WebP files — the converter works in both directions and detects each source format for you.',
    },
    {
      title: 'Choose the direction',
      body: 'Select WebP to shrink images for the web, or JPG and PNG to bring WebP files into software that cannot read them.',
    },
    {
      title: 'Tune the quality',
      body: 'WebP at quality 80 is a sensible default and typically lands well below the equivalent JPEG. Raise it for images with fine detail.',
    },
    {
      title: 'Convert and save',
      body: 'Download each file as it finishes, or collect the whole batch in a single ZIP.',
    },
  ],
  benefitsTitle: 'Why WebP matters',
  benefits: [
    {
      icon: 'compress',
      title: 'Roughly a third smaller',
      body: 'At the same perceived quality, WebP typically produces files 25–35% smaller than JPEG — the single easiest win for page speed.',
    },
    {
      icon: 'image',
      title: 'Transparency included',
      body: 'Unlike JPEG, WebP supports an alpha channel, so it can replace both your JPGs and your transparent PNGs.',
    },
    {
      icon: 'convert',
      title: 'Works in both directions',
      body: 'Downloaded a WebP that your photo editor refuses to open? Convert it straight back to JPG or PNG here.',
    },
    {
      icon: 'device',
      title: 'Universally supported now',
      body: 'Every current browser reads WebP. The compatibility argument against it effectively disappeared several years ago.',
    },
    {
      icon: 'shield',
      title: 'Processed on your device',
      body: 'The conversion uses your browser’s own WebP encoder. No server is involved at any point.',
    },
    {
      icon: 'zip',
      title: 'Whole folders at once',
      body: 'Convert an entire image directory to WebP in one pass and download it as a single archive.',
    },
  ],
  faqs: [
    {
      question: 'What is a WebP file?',
      answer:
        'WebP is an image format developed by Google that supports both lossy and lossless compression as well as transparency. It was designed specifically for the web and generally produces noticeably smaller files than JPEG or PNG at equivalent quality.',
    },
    {
      question: 'Is WebP better than JPG?',
      answer:
        'For images displayed in a browser, almost always. WebP typically produces a file 25–35% smaller at the same perceived quality and additionally supports transparency. JPEG retains the edge only in compatibility with older desktop software and some printing workflows.',
    },
    {
      question: 'How do I open a WebP file?',
      answer:
        'Every modern browser displays WebP directly. If a particular program refuses to open one, convert it to JPG or PNG on this page — that takes a few seconds and produces a file anything can read.',
    },
    {
      question: 'Does converting to WebP preserve transparency?',
      answer:
        'Yes. Converting a transparent PNG to WebP keeps the alpha channel intact, usually at a fraction of the file size. Converting a transparent WebP to JPG does not, because JPEG has no alpha channel — the tool will warn you and let you choose a background colour.',
    },
    {
      question: 'Will my browser definitely support WebP encoding?',
      answer:
        'All current versions of Chrome, Edge, Firefox and Safari can both read and write WebP. If a browser cannot encode it, the tool detects that and tells you rather than silently handing you a mislabelled file.',
    },
  ],
  prose: [
    {
      title: 'Moving a site to WebP',
      paragraphs: [
        'Images are usually the largest thing a web page downloads, often by an order of magnitude. Converting a site’s photographs from JPEG to WebP at the same visual quality typically removes a quarter to a third of total page weight without touching a line of markup.',
        'The practical approach is to convert in bulk, keep the originals, and compare a representative sample before replacing anything. Pay particular attention to images with large flat areas and sharp edges, where WebP’s advantage is largest, and to images with heavy fine texture, where the gap narrows.',
        'If you still need to support software that predates WebP, keep JPEG versions alongside and let the browser choose with a `<picture>` element. For most sites in 2026, though, serving WebP directly is simply the default.',
      ],
    },
  ],
};

export const CONVERTER_PRESETS: Record<string, ConverterPreset> = {
  general: {
    content: CONVERTER_CONTENT,
    defaultTarget: 'image/webp',
    inputHint: 'Add JPG, PNG or WebP images and convert them to any of the three formats.',
  },
  pngToJpg: {
    content: PNG_TO_JPG_CONTENT,
    defaultTarget: 'image/jpeg',
    inputHint: 'Add your PNG files — JPG is already selected as the output format.',
  },
  jpgToPng: {
    content: JPG_TO_PNG_CONTENT,
    defaultTarget: 'image/png',
    inputHint: 'Add your JPG files — PNG is already selected as the output format.',
  },
  webp: {
    content: WEBP_CONVERTER_CONTENT,
    defaultTarget: 'image/webp',
    inputHint: 'Add images in any supported format, then convert to or from WebP.',
  },
};
