import { ToolDefinition } from '../../shared/components/tool-card/tool-card.component';

/**
 * The canonical list of tools.
 *
 * Navigation, the home page, the `/tools` index, internal "related tools" links
 * and the sitemap all read from here, so a new tool is described exactly once.
 *
 * `featured` controls what appears in the top navigation — fourteen tools will
 * not fit there, so only the four core ones are promoted and the rest are
 * reachable from the tools index.
 */
export type ToolCategory = 'optimise' | 'edit' | 'create' | 'inspect';

export interface ToolCategoryInfo {
  readonly id: ToolCategory;
  readonly name: string;
  readonly description: string;
}

export const TOOL_CATEGORIES: readonly ToolCategoryInfo[] = [
  {
    id: 'optimise',
    name: 'Optimise & convert',
    description: 'Make files smaller and move between formats.',
  },
  {
    id: 'edit',
    name: 'Edit & transform',
    description: 'Change the size, framing, orientation and look of a picture.',
  },
  {
    id: 'create',
    name: 'Generate',
    description: 'Produce complete sets of images from a single source.',
  },
  {
    id: 'inspect',
    name: 'Inspect & clean',
    description: 'See what is inside a file, and take out what should not be.',
  },
];

export const TOOLS: readonly ToolDefinition[] = [
  /* ----------------------------- Optimise ----------------------------- */
  {
    id: 'compress',
    name: 'Image Compressor',
    navLabel: 'Compress Image',
    path: '/compress-image',
    icon: 'compress',
    category: 'optimise',
    featured: true,
    tagline: 'Smaller files, same picture',
    description:
      'Shrink JPG, PNG and WebP files by up to 80% with a quality slider you control, and compare the result side by side before you download.',
    accent: 'bg-gradient-to-br from-violet-500 to-purple-600',
  },
  {
    id: 'convert',
    name: 'Image Converter',
    navLabel: 'Convert Image',
    path: '/convert-image',
    icon: 'convert',
    category: 'optimise',
    featured: true,
    tagline: 'Any format, any direction',
    description:
      'Convert between JPG, PNG and WebP in bulk, with transparency preserved wherever the target format supports it.',
    accent: 'bg-gradient-to-br from-cyan-500 to-teal-600',
  },
  {
    id: 'base64',
    name: 'Image to Base64',
    navLabel: 'Image to Base64',
    path: '/image-to-base64',
    icon: 'code',
    category: 'optimise',
    featured: false,
    tagline: 'Inline images in code',
    description:
      'Turn an image into a Base64 data URI ready to paste into CSS, HTML or JSON — and decode Base64 back into a downloadable file.',
    accent: 'bg-gradient-to-br from-slate-600 to-slate-800',
  },

  /* ------------------------------- Edit ------------------------------- */
  {
    id: 'resize',
    name: 'Image Resizer',
    navLabel: 'Resize Image',
    path: '/resize-image',
    icon: 'resize',
    category: 'edit',
    featured: true,
    tagline: 'Exact dimensions in one click',
    description:
      'Set any width and height, lock the aspect ratio, scale by percentage or pick a ready-made preset for social media and the web.',
    accent: 'bg-gradient-to-br from-blue-500 to-indigo-600',
  },
  {
    id: 'crop',
    name: 'Image Cropper',
    navLabel: 'Crop Image',
    path: '/crop-image',
    icon: 'crop',
    category: 'edit',
    featured: true,
    tagline: 'Frame it exactly right',
    description:
      'Drag a crop box over your picture, lock it to a ratio, then zoom, rotate and flip until the framing is perfect.',
    accent: 'bg-gradient-to-br from-fuchsia-500 to-pink-600',
  },
  {
    id: 'rotate',
    name: 'Image Rotator',
    navLabel: 'Rotate Image',
    path: '/rotate-image',
    icon: 'rotate-right',
    category: 'edit',
    featured: false,
    tagline: 'Straighten and turn',
    description:
      'Turn a picture in quarter steps or nudge it by a fraction of a degree to level a crooked horizon, with the canvas grown to fit.',
    accent: 'bg-gradient-to-br from-amber-500 to-orange-600',
  },
  {
    id: 'flip',
    name: 'Image Flipper',
    navLabel: 'Flip Image',
    path: '/flip-image',
    icon: 'flip-horizontal',
    category: 'edit',
    featured: false,
    tagline: 'Mirror horizontally or vertically',
    description:
      'Mirror a photograph left-to-right or top-to-bottom — for fixing selfies, scanned film and artwork that faces the wrong way.',
    accent: 'bg-gradient-to-br from-emerald-500 to-green-600',
  },
  {
    id: 'filters',
    name: 'Image Filters',
    navLabel: 'Image Filters',
    path: '/image-filters',
    icon: 'sparkles',
    category: 'edit',
    featured: false,
    tagline: 'Brightness, contrast, colour',
    description:
      'Adjust brightness, contrast, saturation, warmth and blur with a live preview, ready-made looks, and full undo and redo.',
    accent: 'bg-gradient-to-br from-rose-500 to-red-600',
  },
  {
    id: 'remove-bg',
    name: 'Background Remover',
    navLabel: 'Remove Background',
    path: '/remove-background',
    icon: 'eraser',
    category: 'edit',
    featured: false,
    tagline: 'Cut out the subject',
    description:
      'Remove the background automatically, then refine it with erase and restore brushes, and save a transparent PNG or drop a new colour behind the subject.',
    accent: 'bg-gradient-to-br from-lime-500 to-emerald-600',
  },
  {
    id: 'watermark',
    name: 'Watermark Maker',
    navLabel: 'Add Watermark',
    path: '/watermark-image',
    icon: 'stamp',
    category: 'edit',
    featured: false,
    tagline: 'Protect your work',
    description:
      'Stamp text or a logo across your images, with control over position, size, angle, opacity and tiling — in bulk if you need it.',
    accent: 'bg-gradient-to-br from-indigo-500 to-blue-700',
  },

  /* ------------------------------ Create ------------------------------ */
  {
    id: 'favicon',
    name: 'Favicon Generator',
    navLabel: 'Favicon Generator',
    path: '/favicon-generator',
    icon: 'star',
    category: 'create',
    featured: false,
    tagline: 'Every icon a site needs',
    description:
      'Generate the full set of favicon and app-icon sizes from one image, with the HTML and web manifest to go with them, in a single ZIP.',
    accent: 'bg-gradient-to-br from-yellow-500 to-amber-600',
  },
  {
    id: 'social',
    name: 'Social Media Resizer',
    navLabel: 'Social Sizes',
    path: '/social-media-image-resizer',
    icon: 'share',
    category: 'create',
    featured: false,
    tagline: 'Every platform, one upload',
    description:
      'Produce correctly sized images for Instagram, Facebook, X, LinkedIn, YouTube and Pinterest at once, cropped or padded to fit.',
    accent: 'bg-gradient-to-br from-sky-500 to-blue-600',
  },

  /* ------------------------------ Inspect ----------------------------- */
  {
    id: 'metadata',
    name: 'Metadata Viewer',
    navLabel: 'View Metadata',
    path: '/image-metadata-viewer',
    icon: 'info',
    category: 'inspect',
    featured: false,
    tagline: 'See what your photo reveals',
    description:
      'Read the EXIF data hidden in a photograph — camera, lens, exposure, timestamps and the GPS coordinates most people never realise are there.',
    accent: 'bg-gradient-to-br from-teal-500 to-cyan-700',
  },
  {
    id: 'strip',
    name: 'Metadata Remover',
    navLabel: 'Remove Metadata',
    path: '/remove-metadata',
    icon: 'shield',
    category: 'inspect',
    featured: false,
    tagline: 'Strip EXIF before sharing',
    description:
      'Remove EXIF, GPS, XMP and colour-profile data from your images in bulk, so a photograph cannot tell anyone where you were.',
    accent: 'bg-gradient-to-br from-red-500 to-rose-700',
  },
  {
    id: 'colors',
    name: 'Image Colour Picker',
    navLabel: 'Colour Picker',
    path: '/image-color-picker',
    icon: 'palette',
    category: 'inspect',
    featured: false,
    tagline: 'Pull colours from a picture',
    description:
      'Pick any pixel to get its HEX, RGB and HSL value, and extract the dominant palette of an image for use in a design.',
    accent: 'bg-gradient-to-br from-purple-500 to-fuchsia-700',
  },
];

/**
 * The four core tools, in the order a person usually works through them rather
 * than the category order `TOOLS` is grouped by.
 */
const FEATURED_ORDER: readonly string[] = ['compress', 'resize', 'crop', 'convert'];

export const FEATURED_TOOLS: readonly ToolDefinition[] = FEATURED_ORDER.map((id) => {
  const tool = TOOLS.find((candidate) => candidate.id === id);
  if (!tool) {
    throw new Error(`FEATURED_ORDER references an unknown tool: ${id}`);
  }
  return tool;
});

export function toolsInCategory(category: ToolCategory): readonly ToolDefinition[] {
  return TOOLS.filter((tool) => tool.category === category);
}

export function toolById(id: string): ToolDefinition | undefined {
  return TOOLS.find((tool) => tool.id === id);
}

/** Narrow, high-intent landing pages that target specific searches. */
export interface PopularToolLink {
  readonly name: string;
  readonly path: string;
  readonly description: string;
}

export const POPULAR_TOOLS: readonly PopularToolLink[] = [
  {
    name: 'PNG to JPG',
    path: '/png-to-jpg',
    description: 'Flatten transparent PNGs onto a solid background and save them as compact JPGs.',
  },
  {
    name: 'JPG to PNG',
    path: '/jpg-to-png',
    description: 'Turn photos into lossless PNGs, ready for editing and overlays.',
  },
  {
    name: 'WebP Converter',
    path: '/webp-converter',
    description: 'Move images to and from WebP to cut page weight without losing quality.',
  },
  {
    name: 'Favicon Generator',
    path: '/favicon-generator',
    description: 'Every icon size a website needs, generated from one image.',
  },
  {
    name: 'Remove Background',
    path: '/remove-background',
    description: 'Cut the subject out of a photo and save it as a transparent PNG.',
  },
  {
    name: 'Remove EXIF data',
    path: '/remove-metadata',
    description: 'Strip the GPS coordinates out of a photo before you share it.',
  },
  {
    name: 'Resize for Instagram',
    path: '/social-media-image-resizer',
    description: 'One-click 1080 × 1080 and 1080 × 1350 presets for social posts.',
  },
];
