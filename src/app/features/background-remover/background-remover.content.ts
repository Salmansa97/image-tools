import { ToolPageContent } from '../../seo/seo.models';

export const BACKGROUND_REMOVER_CONTENT: ToolPageContent = {
  toolId: 'remove-bg',
  path: '/remove-background',
  seoTitle: 'Remove Image Background Online — Free Transparent PNG Maker | ImageTools',
  seoDescription:
    'Remove the background from an image online for free. Automatic cut-out with a brush to refine the edges, transparent PNG or WebP output, and nothing ever uploaded.',
  keywords: [
    'remove background from image',
    'background remover',
    'transparent png maker',
    'erase image background',
    'cut out image',
    'remove white background',
  ],
  breadcrumbs: [
    { name: 'Home', path: '/' },
    { name: 'All Tools', path: '/tools' },
    { name: 'Remove Background', path: '/remove-background' },
  ],
  heading: 'Remove Image Backgrounds',
  lead: 'Cut the background out of a photo and save it as a transparent PNG. The automatic pass handles the whole image in a moment, and a brush lets you fix anything it gets wrong — all without uploading a single byte.',
  howItWorksTitle: 'How to remove a background',
  features: [
    'Automatic background detection',
    'Eyedropper to key a specific colour',
    'Erase and restore brushes for touch-ups',
    'Edge feathering and colour de-spill',
    'Transparent PNG, WebP, or a solid backdrop',
  ],
  steps: [
    {
      title: 'Add your image',
      body: 'Drop in a JPG, PNG or WebP file. The background is detected from the edges of the frame straight away.',
    },
    {
      title: 'Tune the cut-out',
      body: 'Raise the tolerance if background is left behind, lower it if the subject is being eaten. Soften the edge and pull it in slightly for a clean join.',
    },
    {
      title: 'Brush in the corrections',
      body: 'Use Erase on anything the automatic pass missed and Restore on anything it took by mistake. Every stroke can be undone.',
    },
    {
      title: 'Download',
      body: 'Save a transparent PNG or WebP, or drop a solid colour behind the subject and export a JPG.',
    },
  ],
  benefitsTitle: 'A cut-out you can actually control',
  benefits: [
    {
      icon: 'eraser',
      title: 'Automatic, then adjustable',
      body: 'Most removers hand you one result and nothing to change. Here every stage — tolerance, edge softness, matte size, de-spill — is a slider you can see working.',
    },
    {
      icon: 'palette',
      title: 'Handles gradients, not just flat colour',
      body: 'The background is sampled as a small palette rather than one colour, and growth follows gentle gradients, so studio sweeps and skies key cleanly.',
    },
    {
      icon: 'sparkles',
      title: 'No coloured fringe',
      body: 'Semi-transparent edge pixels carry the old backdrop’s colour. De-spill removes it, which is the difference between a cut-out that looks placed and one that looks pasted.',
    },
    {
      icon: 'eye',
      title: 'Brushes for the hard parts',
      body: 'No colour key solves every image. Erase and Restore let you finish the job by hand instead of giving up on the result.',
    },
    {
      icon: 'shield',
      title: 'Nothing is uploaded',
      body: 'Every other free background remover sends your photo to a server to run a model. This one runs in your browser, so the picture never leaves your device.',
    },
    {
      icon: 'bolt',
      title: 'Instant feedback',
      body: 'The preview recomputes as you drag, at a working resolution, then the export re-runs at full size in a background thread.',
    },
  ],
  faqs: [
    {
      question: 'What kinds of image does this work best on?',
      answer:
        'Anything with a reasonably distinct background: product shots on white or grey, logos and graphics, scanned documents, screenshots, and portraits taken against a plain wall or studio backdrop. These are the overwhelming majority of images people need to cut out, and the result on them is clean.',
    },
    {
      question: 'Will it cut out a person against a busy street?',
      answer:
        'Not well, and it is better to say so plainly. This is a colour-based cut-out, not a trained model, so it needs the background to be distinguishable by colour. On a cluttered scene the automatic pass will be rough — the Erase and Restore brushes are there so you can still finish the job, but it will take you a minute rather than a second.',
    },
    {
      question: 'Why is part of my subject disappearing?',
      answer:
        'The tolerance is too high, so colours in the subject are close enough to the background to be keyed. Lower it until the subject is whole, then use the Erase brush on any background the lower setting left behind. Switching from Global back to Contiguous also helps, because it only removes background connected to the frame edge.',
    },
    {
      question: 'Why is there a halo around the edges?',
      answer:
        'Two things fix it. Raise De-spill to strip the old background colour out of the semi-transparent edge pixels, and nudge Edge up by one or two so the matte contracts slightly into the subject. A point or two of each usually removes a halo completely.',
    },
    {
      question: 'What format should I save in?',
      answer:
        'PNG for a transparent cut-out that needs to be exact. WebP if you want transparency at a much smaller size and control where the file will be used. If you are placing the subject on a known colour, choose that colour as the backdrop and export JPG — the edges will blend into it properly.',
    },
  ],
  prose: [
    {
      title: 'Getting a clean edge',
      paragraphs: [
        'Almost every bad cut-out fails in the same place: the two or three pixels along the boundary. Those pixels are genuinely a mixture of subject and background, so treating them as fully one or the other produces either a jagged edge or a bright fringe of the old backdrop.',
        'The settings here address that directly. Edge feathers the matte so the boundary is anti-aliased rather than stair-stepped. Matte size pulls that soft edge a fraction of a pixel into the subject, which hides any remaining background. De-spill then recovers the subject’s true colour in those mixed pixels by subtracting the backdrop’s contribution.',
        'The usual recipe is: get the tolerance right first with de-spill at zero, so you can see exactly what is being keyed; then add one or two of Edge; then raise de-spill until the fringe disappears. Changing them in that order takes a few seconds and is the difference between a usable cut-out and an obvious one.',
      ],
    },
  ],
};
