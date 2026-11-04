import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { ImageResizeService } from './image-resize.service';

describe('ImageResizeService', () => {
  let service: ImageResizeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageResizeService);
  });

  it('derives a height that preserves the aspect ratio', () => {
    expect(service.heightForWidth(800, 1600, 1200)).toBe(600);
    expect(service.heightForWidth(100, 1080, 1350)).toBe(125);
  });

  it('derives a width that preserves the aspect ratio', () => {
    expect(service.widthForHeight(600, 1600, 1200)).toBe(800);
  });

  it('never returns a zero dimension', () => {
    expect(service.heightForWidth(1, 10000, 1)).toBe(1);
    expect(service.widthForHeight(1, 1, 10000)).toBe(1);
  });

  it('falls back safely when the source size is unknown', () => {
    expect(service.heightForWidth(800, 0, 0)).toBe(800);
    expect(service.widthForHeight(600, 0, 0)).toBe(600);
  });

  it('scales by percentage', () => {
    expect(service.scaleBy(50, 1600, 1200)).toEqual({ width: 800, height: 600 });
    expect(service.scaleBy(200, 400, 300)).toEqual({ width: 800, height: 600 });
  });

  it('clamps a percentage of zero to at least one pixel', () => {
    expect(service.scaleBy(0, 1600, 1200)).toEqual({ width: 16, height: 12 });
  });
});
