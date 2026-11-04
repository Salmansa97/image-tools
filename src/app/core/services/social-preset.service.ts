import { FitMode } from '../models/image.models';

export interface SocialPreset {
  readonly id: string;
  readonly platform: string;
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly note: string;
}

/**
 * Current image sizes for the major platforms.
 *
 * Grouped by platform so the interface can offer "select all of Instagram"
 * rather than making someone tick nine boxes.
 */
export const SOCIAL_PRESETS: readonly SocialPreset[] = [
  {
    id: 'ig-square',
    platform: 'Instagram',
    name: 'Square post',
    width: 1080,
    height: 1080,
    note: 'The classic 1:1 feed post',
  },
  {
    id: 'ig-portrait',
    platform: 'Instagram',
    name: 'Portrait post',
    width: 1080,
    height: 1350,
    note: 'Takes the most feed space',
  },
  {
    id: 'ig-story',
    platform: 'Instagram',
    name: 'Story / Reel',
    width: 1080,
    height: 1920,
    note: 'Full-screen vertical',
  },

  {
    id: 'fb-post',
    platform: 'Facebook',
    name: 'Feed post',
    width: 1200,
    height: 630,
    note: 'Also used for link previews',
  },
  {
    id: 'fb-cover',
    platform: 'Facebook',
    name: 'Page cover',
    width: 1640,
    height: 856,
    note: 'Crops on mobile',
  },
  {
    id: 'fb-story',
    platform: 'Facebook',
    name: 'Story',
    width: 1080,
    height: 1920,
    note: 'Full-screen vertical',
  },

  {
    id: 'x-post',
    platform: 'X / Twitter',
    name: 'Post image',
    width: 1600,
    height: 900,
    note: '16:9 in-feed image',
  },
  {
    id: 'x-header',
    platform: 'X / Twitter',
    name: 'Profile header',
    width: 1500,
    height: 500,
    note: 'Wide banner',
  },

  {
    id: 'li-post',
    platform: 'LinkedIn',
    name: 'Feed post',
    width: 1200,
    height: 627,
    note: 'Shared link and image posts',
  },
  {
    id: 'li-cover',
    platform: 'LinkedIn',
    name: 'Page cover',
    width: 1128,
    height: 191,
    note: 'Company page banner',
  },

  {
    id: 'yt-thumb',
    platform: 'YouTube',
    name: 'Thumbnail',
    width: 1280,
    height: 720,
    note: 'Minimum for HD video',
  },
  {
    id: 'yt-banner',
    platform: 'YouTube',
    name: 'Channel art',
    width: 2560,
    height: 1440,
    note: 'Safe area is much smaller',
  },

  {
    id: 'pin-standard',
    platform: 'Pinterest',
    name: 'Standard pin',
    width: 1000,
    height: 1500,
    note: 'The 2:3 ratio Pinterest prefers',
  },

  {
    id: 'og-default',
    platform: 'Web',
    name: 'Open Graph',
    width: 1200,
    height: 630,
    note: 'Link previews across the web',
  },
];

export const SOCIAL_PLATFORMS: readonly string[] = [
  ...new Set(SOCIAL_PRESETS.map((preset) => preset.platform)),
];

export interface SocialExportSettings {
  readonly fit: FitMode;
  readonly background: string;
  readonly transparentPadding: boolean;
  readonly format: 'image/jpeg' | 'image/png' | 'image/webp';
  readonly quality: number;
}
