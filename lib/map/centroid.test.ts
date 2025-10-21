import { describe, it, expect } from 'vitest';
import { area, computeCentroid, type Point } from './centroid';

describe('centroid calculations', () => {
  describe('area', () => {
    it('should calculate area of a square', () => {
      const square: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];

      const result = area(square);

      // Area = 10 * 10 = 100
      expect(Math.abs(result)).toBeCloseTo(100, 1);
    });

    it('should calculate area of a triangle', () => {
      const triangle: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 5, y: 10 },
      ];

      const result = area(triangle);

      // Area = 0.5 * base * height = 0.5 * 10 * 10 = 50
      expect(Math.abs(result)).toBeCloseTo(50, 1);
    });

    it('should calculate area of a rectangle', () => {
      const rectangle: Point[] = [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 10 },
        { x: 0, y: 10 },
      ];

      const result = area(rectangle);

      // Area = 20 * 10 = 200
      expect(Math.abs(result)).toBeCloseTo(200, 1);
    });

    it('should handle clockwise vs counter-clockwise orientation', () => {
      const clockwise: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];

      const counterClockwise: Point[] = [
        { x: 0, y: 0 },
        { x: 0, y: 10 },
        { x: 10, y: 10 },
        { x: 10, y: 0 },
      ];

      const cwArea = area(clockwise);
      const ccwArea = area(counterClockwise);

      // Areas should have opposite signs but same magnitude
      expect(Math.abs(cwArea)).toBeCloseTo(Math.abs(ccwArea), 1);
      expect(cwArea).toBeCloseTo(-ccwArea, 1);
    });

    it('should return zero for degenerate polygon (line)', () => {
      const line: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 20, y: 0 },
      ];

      const result = area(line);

      expect(Math.abs(result)).toBeCloseTo(0, 1);
    });

    it('should handle single point', () => {
      const point: Point[] = [{ x: 5, y: 5 }];

      const result = area(point);

      expect(result).toBe(0);
    });

    it('should handle two points (line segment)', () => {
      const segment: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ];

      const result = area(segment);

      expect(result).toBe(0);
    });

    it('should calculate area of irregular polygon', () => {
      const polygon: Point[] = [
        { x: 0, y: 0 },
        { x: 4, y: 0 },
        { x: 4, y: 3 },
        { x: 2, y: 5 },
        { x: 0, y: 3 },
      ];

      const result = area(polygon);

      // Area should be positive or negative depending on orientation
      expect(Math.abs(result)).toBeGreaterThan(0);
    });
  });

  describe('computeCentroid', () => {
    it('should compute centroid of a square at its center', () => {
      const square: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];

      const [cx, cy] = computeCentroid(square);

      // Centroid of square should be at (5, 5)
      expect(cx).toBeCloseTo(5, 1);
      expect(cy).toBeCloseTo(5, 1);
    });

    it('should compute centroid of a triangle', () => {
      const triangle: Point[] = [
        { x: 0, y: 0 },
        { x: 6, y: 0 },
        { x: 0, y: 6 },
      ];

      const [cx, cy] = computeCentroid(triangle);

      // Centroid of right triangle at (0,0), (6,0), (0,6) is at (2, 2)
      expect(cx).toBeCloseTo(2, 1);
      expect(cy).toBeCloseTo(2, 1);
    });

    it('should compute centroid of a rectangle', () => {
      const rectangle: Point[] = [
        { x: 10, y: 20 },
        { x: 30, y: 20 },
        { x: 30, y: 40 },
        { x: 10, y: 40 },
      ];

      const [cx, cy] = computeCentroid(rectangle);

      // Centroid should be at center: (20, 30)
      expect(cx).toBeCloseTo(20, 1);
      expect(cy).toBeCloseTo(30, 1);
    });

    it('should be invariant to starting point for closed polygon', () => {
      const polygon1: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];

      const polygon2: Point[] = [
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
        { x: 0, y: 0 },
      ];

      const [cx1, cy1] = computeCentroid(polygon1);
      const [cx2, cy2] = computeCentroid(polygon2);

      // Should get same centroid regardless of starting point
      expect(cx1).toBeCloseTo(cx2, 1);
      expect(cy1).toBeCloseTo(cy2, 1);
    });

    it('should handle equilateral triangle', () => {
      const triangle: Point[] = [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 1, y: Math.sqrt(3) },
      ];

      const [cx, cy] = computeCentroid(triangle);

      // Centroid should be at (1, sqrt(3)/3)
      expect(cx).toBeCloseTo(1, 1);
      expect(cy).toBeCloseTo(Math.sqrt(3) / 3, 1);
    });

    it('should handle complex irregular polygon', () => {
      const polygon: Point[] = [
        { x: 1, y: 1 },
        { x: 4, y: 2 },
        { x: 5, y: 5 },
        { x: 3, y: 7 },
        { x: 1, y: 5 },
      ];

      const [cx, cy] = computeCentroid(polygon);

      // Centroid should be inside the polygon
      expect(cx).toBeGreaterThan(1);
      expect(cx).toBeLessThan(5);
      expect(cy).toBeGreaterThan(1);
      expect(cy).toBeLessThan(7);
    });

    it('should handle L-shaped polygon', () => {
      const lShape: Point[] = [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: 2 },
        { x: 0, y: 2 },
      ];

      const [cx, cy] = computeCentroid(lShape);

      // Centroid should be within the L-shape bounds
      expect(cx).toBeGreaterThan(0);
      expect(cx).toBeLessThan(2);
      expect(cy).toBeGreaterThan(0);
      expect(cy).toBeLessThan(2);
    });

    it('should handle polygon with negative coordinates', () => {
      const polygon: Point[] = [
        { x: -5, y: -5 },
        { x: 5, y: -5 },
        { x: 5, y: 5 },
        { x: -5, y: 5 },
      ];

      const [cx, cy] = computeCentroid(polygon);

      // Centroid should be at origin
      expect(cx).toBeCloseTo(0, 1);
      expect(cy).toBeCloseTo(0, 1);
    });

    it('should handle single point (degenerate case)', () => {
      const point: Point[] = [{ x: 5, y: 10 }];

      const [cx, cy] = computeCentroid(point);

      // When area is 0, result will be NaN or Infinity
      // This is expected behavior for degenerate case
      expect(isNaN(cx) || !isFinite(cx)).toBe(true);
    });

    it('should handle two points (line segment)', () => {
      const segment: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ];

      const [cx, cy] = computeCentroid(segment);

      // When area is 0, result will be NaN or Infinity
      // This is expected behavior for degenerate case
      expect(isNaN(cx) || !isFinite(cx)).toBe(true);
    });

    it('should compute centroid for unit square at origin', () => {
      const unitSquare: Point[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ];

      const [cx, cy] = computeCentroid(unitSquare);

      expect(cx).toBeCloseTo(0.5, 1);
      expect(cy).toBeCloseTo(0.5, 1);
    });

    it('should work with floating point coordinates', () => {
      const polygon: Point[] = [
        { x: 1.5, y: 2.3 },
        { x: 4.7, y: 2.1 },
        { x: 5.2, y: 6.8 },
        { x: 2.1, y: 7.4 },
      ];

      const [cx, cy] = computeCentroid(polygon);

      // Should return valid numbers
      expect(isFinite(cx)).toBe(true);
      expect(isFinite(cy)).toBe(true);
      expect(cx).toBeGreaterThan(1.5);
      expect(cx).toBeLessThan(5.2);
    });

    it('should handle very small polygon', () => {
      const tiny: Point[] = [
        { x: 0, y: 0 },
        { x: 0.001, y: 0 },
        { x: 0.001, y: 0.001 },
        { x: 0, y: 0.001 },
      ];

      const [cx, cy] = computeCentroid(tiny);

      // Centroid should be at center of tiny square
      expect(cx).toBeCloseTo(0.0005, 4);
      expect(cy).toBeCloseTo(0.0005, 4);
    });

    it('should handle very large polygon', () => {
      const large: Point[] = [
        { x: 0, y: 0 },
        { x: 10000, y: 0 },
        { x: 10000, y: 10000 },
        { x: 0, y: 10000 },
      ];

      const [cx, cy] = computeCentroid(large);

      // Centroid should be at center
      expect(cx).toBeCloseTo(5000, 0);
      expect(cy).toBeCloseTo(5000, 0);
    });
  });

  describe('integration', () => {
    it('should compute consistent centroid and area for same polygon', () => {
      const polygon: Point[] = [
        { x: 2, y: 3 },
        { x: 8, y: 3 },
        { x: 8, y: 9 },
        { x: 2, y: 9 },
      ];

      const polygonArea = area(polygon);
      const [cx, cy] = computeCentroid(polygon);

      // Area should be 36 (6 * 6)
      expect(Math.abs(polygonArea)).toBeCloseTo(36, 1);

      // Centroid should be at (5, 6)
      expect(cx).toBeCloseTo(5, 1);
      expect(cy).toBeCloseTo(6, 1);
    });

    it('should maintain centroid when polygon is translated', () => {
      const original: Point[] = [
        { x: 0, y: 0 },
        { x: 4, y: 0 },
        { x: 4, y: 4 },
        { x: 0, y: 4 },
      ];

      const translated: Point[] = original.map((p) => ({
        x: p.x + 10,
        y: p.y + 20,
      }));

      const [cx1, cy1] = computeCentroid(original);
      const [cx2, cy2] = computeCentroid(translated);

      // Centroid should be translated by same amount
      expect(cx2).toBeCloseTo(cx1 + 10, 1);
      expect(cy2).toBeCloseTo(cy1 + 20, 1);
    });
  });
});
