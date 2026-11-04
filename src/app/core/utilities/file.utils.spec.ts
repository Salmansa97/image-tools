import { describe, expect, it } from 'vitest';

import { MAX_FILE_SIZE_BYTES } from '../models/image.models';
import {
  baseNameOf,
  buildFileName,
  formatBytes,
  resolveMimeType,
  resolveOutputFormat,
  sanitiseFileName,
  savingsPercent,
  uniqueName,
  validateFiles,
} from './file.utils';

function fakeFile(name: string, size: number, type: string): File {
  const file = new File(['x'], name, { type });
  // `File` size is derived from its contents, which we do not want to allocate.
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('formatBytes', () => {
  it('uses byte, KB and MB units', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1.00 KB');
    expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.50 MB');
  });

  it('drops decimals as numbers grow', () => {
    expect(formatBytes(150 * 1024)).toBe('150 KB');
    expect(formatBytes(15 * 1024)).toBe('15.0 KB');
  });

  it('handles nonsense input without throwing', () => {
    expect(formatBytes(Number.NaN)).toBe('—');
    expect(formatBytes(-1)).toBe('—');
  });
});

describe('savingsPercent', () => {
  it('reports the reduction', () => {
    expect(savingsPercent(1000, 250)).toBe(75);
  });

  it('goes negative when the output grew', () => {
    expect(savingsPercent(100, 150)).toBe(-50);
  });

  it('does not divide by zero', () => {
    expect(savingsPercent(0, 100)).toBe(0);
  });
});

describe('resolveMimeType', () => {
  it('trusts a supported type', () => {
    expect(resolveMimeType(fakeFile('a.png', 10, 'image/png'))).toBe('image/png');
  });

  it('falls back to the extension when the browser reports nothing', () => {
    expect(resolveMimeType(fakeFile('photo.WEBP', 10, ''))).toBe('image/webp');
    expect(resolveMimeType(fakeFile('photo.jpeg', 10, ''))).toBe('image/jpeg');
  });
});

describe('resolveOutputFormat', () => {
  it('keeps the source format for "original"', () => {
    expect(resolveOutputFormat('original', 'image/webp')).toBe('image/webp');
  });

  it('falls back to JPEG when the source type is not encodable', () => {
    expect(resolveOutputFormat('original', 'image/heic')).toBe('image/jpeg');
  });

  it('passes an explicit format straight through', () => {
    expect(resolveOutputFormat('image/png', 'image/jpeg')).toBe('image/png');
  });
});

describe('file naming', () => {
  it('strips the extension for the base name', () => {
    expect(baseNameOf('holiday photo.final.png')).toBe('holiday photo.final');
    expect(baseNameOf('.gitignore')).toBe('.gitignore');
  });

  it('builds an output name with the new extension', () => {
    expect(buildFileName('holiday', 'image/jpeg', 'compressed')).toBe('holiday-compressed.jpg');
    expect(buildFileName('holiday', 'image/webp', '')).toBe('holiday.webp');
  });

  it('removes characters that break downloads', () => {
    expect(sanitiseFileName('a/b\\c:d*e?f"g<h>i|j')).toBe('abcdefghij');
    expect(sanitiseFileName('   ')).toBe('image');
  });

  it('de-duplicates names within an archive', () => {
    const taken = new Set<string>();
    expect(uniqueName('a.jpg', taken)).toBe('a.jpg');
    expect(uniqueName('a.jpg', taken)).toBe('a (2).jpg');
    expect(uniqueName('a.jpg', taken)).toBe('a (3).jpg');
  });
});

describe('validateFiles', () => {
  it('accepts supported images', () => {
    const { accepted, rejected } = validateFiles([fakeFile('a.jpg', 1000, 'image/jpeg')]);
    expect(accepted).toHaveLength(1);
    expect(rejected).toHaveLength(0);
  });

  it('rejects unsupported types, empty files and oversized files', () => {
    const { accepted, rejected } = validateFiles([
      fakeFile('a.gif', 1000, 'image/gif'),
      fakeFile('b.png', 0, 'image/png'),
      fakeFile('c.png', MAX_FILE_SIZE_BYTES + 1, 'image/png'),
    ]);

    expect(accepted).toHaveLength(0);
    expect(rejected.map((r) => r.reason)).toEqual(['unsupported-type', 'empty', 'too-large']);
    expect(rejected[2].message).toContain('50 MB');
  });

  it('rejects a file that is already in the batch', () => {
    const file = fakeFile('a.jpg', 1000, 'image/jpeg');
    const { rejected } = validateFiles([file], {
      existingKeys: new Set([`${file.name}:${file.size}:${file.lastModified}`]),
    });
    expect(rejected[0].reason).toBe('duplicate');
  });

  it('rejects the second copy within a single selection', () => {
    const file = fakeFile('a.jpg', 1000, 'image/jpeg');
    const { accepted, rejected } = validateFiles([file, file]);
    expect(accepted).toHaveLength(1);
    expect(rejected).toHaveLength(1);
  });
});
