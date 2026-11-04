import { Injectable, inject } from '@angular/core';

import { FitMode, ImageItem } from '../models/image.models';
import { ImageFitService } from './image-fit.service';

export interface FaviconSize {
  readonly size: number;
  readonly fileName: string;
  readonly label: string;
  readonly purpose: string;
  /** Included in the generated `.ico` bundle. */
  readonly inIco: boolean;
  /** Produced by default; the rest are opt-in. */
  readonly standard: boolean;
}

export const FAVICON_SIZES: readonly FaviconSize[] = [
  {
    size: 16,
    fileName: 'favicon-16x16.png',
    label: '16 × 16',
    purpose: 'Browser tab',
    inIco: true,
    standard: true,
  },
  {
    size: 32,
    fileName: 'favicon-32x32.png',
    label: '32 × 32',
    purpose: 'Browser tab, retina',
    inIco: true,
    standard: true,
  },
  {
    size: 48,
    fileName: 'favicon-48x48.png',
    label: '48 × 48',
    purpose: 'Windows taskbar',
    inIco: true,
    standard: true,
  },
  {
    size: 96,
    fileName: 'favicon-96x96.png',
    label: '96 × 96',
    purpose: 'Desktop shortcut',
    inIco: false,
    standard: false,
  },
  {
    size: 120,
    fileName: 'apple-touch-icon-120x120.png',
    label: '120 × 120',
    purpose: 'iPhone',
    inIco: false,
    standard: false,
  },
  {
    size: 152,
    fileName: 'apple-touch-icon-152x152.png',
    label: '152 × 152',
    purpose: 'iPad',
    inIco: false,
    standard: false,
  },
  {
    size: 180,
    fileName: 'apple-touch-icon.png',
    label: '180 × 180',
    purpose: 'iOS home screen',
    inIco: false,
    standard: true,
  },
  {
    size: 192,
    fileName: 'android-chrome-192x192.png',
    label: '192 × 192',
    purpose: 'Android home screen',
    inIco: false,
    standard: true,
  },
  {
    size: 256,
    fileName: 'favicon-256x256.png',
    label: '256 × 256',
    purpose: 'High-DPI shortcut',
    inIco: false,
    standard: false,
  },
  {
    size: 512,
    fileName: 'android-chrome-512x512.png',
    label: '512 × 512',
    purpose: 'PWA splash screen',
    inIco: false,
    standard: true,
  },
];

export interface FaviconOptions {
  readonly sizes: readonly number[];
  readonly fit: FitMode;
  readonly background: string;
  readonly transparent: boolean;
  readonly includeIco: boolean;
  readonly appName: string;
  readonly themeColor: string;
}

export interface GeneratedIcon {
  readonly size: number;
  readonly fileName: string;
  readonly label: string;
  readonly purpose: string;
  readonly blob: Blob;
  readonly url: string;
}

export interface FaviconBundle {
  readonly icons: readonly GeneratedIcon[];
  readonly ico: Blob | null;
  readonly manifest: string;
  readonly html: string;
}

@Injectable({ providedIn: 'root' })
export class FaviconService {
  private readonly fitService = inject(ImageFitService);

  /**
   * Renders every requested size and assembles the extras a site actually needs:
   * a multi-resolution `.ico`, a web manifest and the `<link>` tags to paste.
   */
  async generate(
    item: ImageItem,
    options: FaviconOptions,
    onProgress?: (done: number, total: number) => void,
    signal?: AbortSignal,
  ): Promise<FaviconBundle> {
    const requested = FAVICON_SIZES.filter((entry) => options.sizes.includes(entry.size));
    if (requested.length === 0) {
      throw new Error('Choose at least one icon size.');
    }

    const icons: GeneratedIcon[] = [];

    for (const [index, entry] of requested.entries()) {
      const output = await this.fitService.fit(
        item,
        {
          width: entry.size,
          height: entry.size,
          fit: options.fit,
          background: options.background,
          transparentPadding: options.transparent,
          // Icons are small and sharp-edged: PNG at full quality is the right call.
          format: 'image/png',
          quality: 100,
        },
        signal,
      );

      icons.push({
        size: entry.size,
        fileName: entry.fileName,
        label: entry.label,
        purpose: entry.purpose,
        blob: output.blob,
        url: URL.createObjectURL(output.blob),
      });

      onProgress?.(index + 1, requested.length);
    }

    const ico = options.includeIco ? await this.buildIco(icons) : null;

    return {
      icons,
      ico,
      manifest: this.buildManifest(icons, options),
      html: this.buildHtml(icons, options, ico !== null),
    };
  }

  /**
   * Packs PNGs into a Windows `.ico` container.
   *
   * ICO can embed PNG data directly rather than the legacy BMP layout, which
   * every browser released in the past decade understands, and which means we can
   * reuse the PNGs we already encoded instead of writing a BMP encoder.
   */
  private async buildIco(icons: readonly GeneratedIcon[]): Promise<Blob | null> {
    const entries = icons
      .filter((icon) => FAVICON_SIZES.find((size) => size.size === icon.size)?.inIco)
      .filter((icon) => icon.size <= 256)
      .sort((a, b) => a.size - b.size);

    if (entries.length === 0) {
      return null;
    }

    const payloads = await Promise.all(entries.map((icon) => icon.blob.arrayBuffer()));

    const HEADER = 6;
    const DIRECTORY_ENTRY = 16;
    const directorySize = HEADER + DIRECTORY_ENTRY * entries.length;
    const totalSize = directorySize + payloads.reduce((sum, buffer) => sum + buffer.byteLength, 0);

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    view.setUint16(0, 0, true); // reserved
    view.setUint16(2, 1, true); // type: 1 = icon
    view.setUint16(4, entries.length, true);

    let offset = directorySize;

    entries.forEach((icon, index) => {
      const dir = HEADER + index * DIRECTORY_ENTRY;
      // 0 means 256 in the one-byte dimension fields.
      view.setUint8(dir, icon.size >= 256 ? 0 : icon.size);
      view.setUint8(dir + 1, icon.size >= 256 ? 0 : icon.size);
      view.setUint8(dir + 2, 0); // palette size
      view.setUint8(dir + 3, 0); // reserved
      view.setUint16(dir + 4, 1, true); // colour planes
      view.setUint16(dir + 6, 32, true); // bits per pixel
      view.setUint32(dir + 8, payloads[index].byteLength, true);
      view.setUint32(dir + 12, offset, true);

      bytes.set(new Uint8Array(payloads[index]), offset);
      offset += payloads[index].byteLength;
    });

    return new Blob([buffer], { type: 'image/x-icon' });
  }

  private buildManifest(icons: readonly GeneratedIcon[], options: FaviconOptions): string {
    const manifestIcons = icons
      .filter((icon) => icon.size >= 192)
      .map((icon) => ({
        src: `/${icon.fileName}`,
        sizes: `${icon.size}x${icon.size}`,
        type: 'image/png',
        purpose: 'any maskable',
      }));

    return JSON.stringify(
      {
        name: options.appName || 'My Website',
        short_name: options.appName || 'My Website',
        icons: manifestIcons,
        theme_color: options.themeColor,
        background_color: options.background,
        display: 'standalone',
        start_url: '/',
      },
      null,
      2,
    );
  }

  private buildHtml(
    icons: readonly GeneratedIcon[],
    options: FaviconOptions,
    hasIco: boolean,
  ): string {
    const lines: string[] = [];

    if (hasIco) {
      lines.push('<link rel="icon" href="/favicon.ico" sizes="any">');
    }
    for (const icon of icons) {
      if (icon.fileName.startsWith('apple-touch-icon')) {
        continue;
      }
      if (icon.size <= 96) {
        lines.push(
          `<link rel="icon" type="image/png" sizes="${icon.size}x${icon.size}" href="/${icon.fileName}">`,
        );
      }
    }
    if (icons.some((icon) => icon.fileName === 'apple-touch-icon.png')) {
      lines.push('<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">');
    }
    lines.push('<link rel="manifest" href="/site.webmanifest">');
    lines.push(`<meta name="theme-color" content="${options.themeColor}">`);

    return lines.join('\n');
  }
}
