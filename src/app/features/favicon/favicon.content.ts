import { ToolPageContent } from '../../seo/seo.models';

export const FAVICON_CONTENT: ToolPageContent = {
  toolId: 'favicon',
  path: '/favicon-generator',
  seoTitle: 'Favicon Generator — Free Favicon & App Icon Maker from Any Image | ImageTools',
  seoDescription:
    'Generate a complete favicon set from one image, free. Every size browsers and phones need, plus a multi-resolution .ico, web manifest and HTML, in a single ZIP.',
  keywords: [
    'favicon generator',
    'favicon maker',
    'create favicon',
    'ico generator',
    'apple touch icon',
    'png to ico',
  ],
  breadcrumbs: [
    { name: 'Home', path: '/' },
    { name: 'All Tools', path: '/tools' },
    { name: 'Favicon Generator', path: '/favicon-generator' },
  ],
  heading: 'Favicon Generator',
  lead: 'Turn one image into every icon a website needs — browser tabs, Windows shortcuts, iOS home screens and Android launchers — plus the .ico file, web manifest and HTML to go with them.',
  howItWorksTitle: 'How to make a favicon',
  features: [
    'Ten icon sizes from 16 to 512 pixels',
    'Multi-resolution .ico file',
    'Generated site.webmanifest',
    'Copy-paste HTML for your <head>',
    'Everything in one ZIP',
  ],
  steps: [
    {
      title: 'Upload a square image',
      body: 'A logo or mark works best. Square is ideal; anything else can be cropped to fill or padded to fit.',
    },
    {
      title: 'Choose your sizes',
      body: 'The standard set covers every current browser and phone. Add the extras if you support older Windows shortcuts.',
    },
    {
      title: 'Set the background',
      body: 'Keep it transparent for PNG icons, or pick a colour — many platforms place icons on a light surface where a transparent logo disappears.',
    },
    {
      title: 'Download the bundle',
      body: 'Take the ZIP, drop its contents into your site root, and paste the HTML snippet into your <head>.',
    },
  ],
  benefitsTitle: 'A favicon set that is actually complete',
  benefits: [
    {
      icon: 'star',
      title: 'Every size that matters',
      body: '16 and 32 for tabs, 48 for Windows, 180 for iOS, 192 and 512 for Android and PWAs. Missing any of them means a blurry icon somewhere.',
    },
    {
      icon: 'code',
      title: 'The HTML written for you',
      body: 'Icon markup is fiddly and easy to get subtly wrong. The generated snippet is ready to paste, with the right rel, sizes and type attributes.',
    },
    {
      icon: 'grid',
      title: 'A real multi-size .ico',
      body: 'The .ico embeds 16, 32 and 48 pixel versions in one file, so Windows and older browsers pick the right one instead of scaling badly.',
    },
    {
      icon: 'image',
      title: 'Sharp at small sizes',
      body: 'Each size is downscaled in halving steps rather than one jump, which keeps a 16-pixel icon legible instead of mushy.',
    },
    {
      icon: 'shield',
      title: 'Your logo stays private',
      body: 'Unreleased branding is exactly the sort of thing you should not upload to a free web service. Here it never leaves your device.',
    },
    {
      icon: 'zip',
      title: 'One download',
      body: 'Icons, .ico, manifest and HTML arrive as a single ZIP assembled in your browser.',
    },
  ],
  faqs: [
    {
      question: 'What size should a favicon be?',
      answer:
        'There is no single size. Browsers want 16 × 16 and 32 × 32, Windows uses 48 × 48, iOS home screens use 180 × 180, and Android and PWAs want 192 × 192 and 512 × 512. This generator produces all of them from one source, which is why the standard set is six files rather than one.',
    },
    {
      question: 'Do I still need a favicon.ico file?',
      answer:
        'It is no longer strictly required — modern browsers happily use PNG icons declared with link tags. It is still worth including, because browsers request /favicon.ico by default even when nothing declares it, and some older software looks for nothing else.',
    },
    {
      question: 'What image should I start from?',
      answer:
        'A simple, high-contrast mark, square, and at least 512 pixels on a side. Detailed logos and anything with text become unreadable at 16 pixels — most well-known sites use a single letter or a simplified glyph rather than their full logo.',
    },
    {
      question: 'Should the background be transparent?',
      answer:
        'For PNG icons, usually yes — it lets the icon sit cleanly on light and dark browser chrome. The exception is iOS, which places the Apple touch icon on a surface without adding a background, so a transparent logo can appear to float oddly. Picking a solid colour avoids that.',
    },
    {
      question: 'Where do I put the files?',
      answer:
        'In the root of your website, so they are reachable at /favicon.ico, /favicon-32x32.png and so on. Then paste the generated HTML into the <head> of your pages. The paths in the snippet assume the root; adjust them if you serve icons from a subfolder.',
    },
  ],
  prose: [
    {
      title: 'Designing for sixteen pixels',
      paragraphs: [
        'A favicon is often displayed at 16 × 16 — a space roughly the size of this full stop. Almost nothing survives that reduction intact. Fine lines disappear, gradients turn to mud, and any text becomes a grey smudge.',
        'The marks that work are brutally simple: one letter, one shape, two colours with strong contrast between them. If your logo is a wordmark, use its initial. If it is detailed, draw a simplified version specifically for the icon rather than hoping the downscale is kind.',
        'Test at the real size rather than zoomed in. The preview grid on this page renders each icon at its true dimensions for exactly that reason — a mark that looks fine at 512 pixels can be unrecognisable at 16, and you want to discover that here rather than after deploying.',
      ],
    },
  ],
};
