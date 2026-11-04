import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, expect, it } from 'vitest';

import { ImageCropService } from './image-crop.service';

describe('ImageCropService', () => {
  let service: ImageCropService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageCropService);
  });

  describe('transformedSize', () => {
    it('swaps the axes on a quarter turn', () => {
      expect(service.transformedSize(1600, 1200, 90)).toEqual({ width: 1200, height: 1600 });
      expect(service.transformedSize(1600, 1200, 270)).toEqual({ width: 1200, height: 1600 });
    });

    it('leaves the axes alone on a half turn', () => {
      expect(service.transformedSize(1600, 1200, 0)).toEqual({ width: 1600, height: 1200 });
      expect(service.transformedSize(1600, 1200, 180)).toEqual({ width: 1600, height: 1200 });
    });
  });

  describe('centredRect', () => {
    it('covers the whole image when the ratio is free', () => {
      expect(service.centredRect(1600, 1200, null)).toEqual({
        x: 0,
        y: 0,
        width: 1600,
        height: 1200,
      });
    });

    it('fits a square inside a landscape image and centres it', () => {
      const rect = service.centredRect(1600, 1200, 1);
      expect(rect).toEqual({ x: 200, y: 0, width: 1200, height: 1200 });
    });

    it('fits a wide ratio inside a portrait image', () => {
      const rect = service.centredRect(1200, 1600, 16 / 9);
      expect(rect.width).toBe(1200);
      expect(rect.height).toBe(675);
      expect(rect.y).toBe(Math.round((1600 - 675) / 2));
    });

    it('never exceeds the bounds', () => {
      const rect = service.centredRect(800, 600, 9 / 16);
      expect(rect.width).toBeLessThanOrEqual(800);
      expect(rect.height).toBeLessThanOrEqual(600);
    });
  });

  describe('clampRect', () => {
    it('pushes a rectangle back inside the image', () => {
      const rect = service.clampRect({ x: -50, y: -20, width: 400, height: 300 }, 1000, 800);
      expect(rect).toEqual({ x: 0, y: 0, width: 400, height: 300 });
    });

    it('shrinks a rectangle larger than the image', () => {
      const rect = service.clampRect({ x: 0, y: 0, width: 2000, height: 2000 }, 1000, 800);
      expect(rect).toEqual({ x: 0, y: 0, width: 1000, height: 800 });
    });

    it('slides a rectangle that overhangs the right edge', () => {
      const rect = service.clampRect({ x: 900, y: 0, width: 400, height: 300 }, 1000, 800);
      expect(rect.x + rect.width).toBeLessThanOrEqual(1000);
    });

    it('never produces a zero-sized rectangle', () => {
      const rect = service.clampRect({ x: 0, y: 0, width: 0, height: 0 }, 1000, 800);
      expect(rect.width).toBeGreaterThanOrEqual(1);
      expect(rect.height).toBeGreaterThanOrEqual(1);
    });
  });
});
