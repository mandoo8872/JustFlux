import { describe, expect, it } from "vitest";
import { bboxContainsPoint, bboxIntersects } from "./coordMapper";
import type { BBox } from "../model/types";

describe("bboxContainsPoint", () => {
  const bbox: BBox = { x: 10, y: 20, width: 100, height: 50 };

  it("should return true for a point strictly inside the bbox", () => {
    expect(bboxContainsPoint(bbox, 50, 40)).toBe(true);
  });

  describe("edge cases - points on edges", () => {
    it("should return true for a point on the left edge", () => {
      expect(bboxContainsPoint(bbox, 10, 40)).toBe(true);
    });

    it("should return true for a point on the right edge", () => {
      expect(bboxContainsPoint(bbox, 110, 40)).toBe(true);
    });

    it("should return true for a point on the top edge", () => {
      expect(bboxContainsPoint(bbox, 50, 20)).toBe(true);
    });

    it("should return true for a point on the bottom edge", () => {
      expect(bboxContainsPoint(bbox, 50, 70)).toBe(true);
    });
  });

  describe("edge cases - points on corners", () => {
    it("should return true for the top-left corner", () => {
      expect(bboxContainsPoint(bbox, 10, 20)).toBe(true);
    });

    it("should return true for the top-right corner", () => {
      expect(bboxContainsPoint(bbox, 110, 20)).toBe(true);
    });

    it("should return true for the bottom-left corner", () => {
      expect(bboxContainsPoint(bbox, 10, 70)).toBe(true);
    });

    it("should return true for the bottom-right corner", () => {
      expect(bboxContainsPoint(bbox, 110, 70)).toBe(true);
    });
  });

  describe("points outside the bbox", () => {
    it("should return false for a point to the left", () => {
      expect(bboxContainsPoint(bbox, 9, 40)).toBe(false);
    });

    it("should return false for a point to the right", () => {
      expect(bboxContainsPoint(bbox, 111, 40)).toBe(false);
    });

    it("should return false for a point above", () => {
      expect(bboxContainsPoint(bbox, 50, 19)).toBe(false);
    });

    it("should return false for a point below", () => {
      expect(bboxContainsPoint(bbox, 50, 71)).toBe(false);
    });

    it("should return false for a point far away", () => {
      expect(bboxContainsPoint(bbox, 1000, 1000)).toBe(false);
    });
  });

  describe("special bboxes", () => {
    it("should work with a zero-width bbox (vertical line)", () => {
      const lineBBox: BBox = { x: 10, y: 20, width: 0, height: 50 };
      expect(bboxContainsPoint(lineBBox, 10, 30)).toBe(true);
      expect(bboxContainsPoint(lineBBox, 11, 30)).toBe(false);
    });

    it("should work with a zero-height bbox (horizontal line)", () => {
      const lineBBox: BBox = { x: 10, y: 20, width: 100, height: 0 };
      expect(bboxContainsPoint(lineBBox, 50, 20)).toBe(true);
      expect(bboxContainsPoint(lineBBox, 50, 21)).toBe(false);
    });

    it("should work with a zero-size bbox (point)", () => {
      const pointBBox: BBox = { x: 10, y: 20, width: 0, height: 0 };
      expect(bboxContainsPoint(pointBBox, 10, 20)).toBe(true);
      expect(bboxContainsPoint(pointBBox, 10.1, 20)).toBe(false);
    });
  });
});

describe("bboxIntersects", () => {
  const bbox1: BBox = { x: 10, y: 10, width: 50, height: 50 };

  describe("intersecting", () => {
    it("should return true for identical bboxes", () => {
      expect(bboxIntersects(bbox1, bbox1)).toBe(true);
    });

    it("should return true for partial intersection", () => {
      const bbox2: BBox = { x: 30, y: 30, width: 50, height: 50 };
      expect(bboxIntersects(bbox1, bbox2)).toBe(true);
      expect(bboxIntersects(bbox2, bbox1)).toBe(true);
    });

    it("should return true for one completely inside another", () => {
      const bbox2: BBox = { x: 20, y: 20, width: 10, height: 10 };
      expect(bboxIntersects(bbox1, bbox2)).toBe(true);
      expect(bboxIntersects(bbox2, bbox1)).toBe(true);
    });
  });

  describe("touching", () => {
    it("should return true when touching on the left/right edge", () => {
      const bbox2: BBox = { x: 60, y: 10, width: 50, height: 50 };
      expect(bboxIntersects(bbox1, bbox2)).toBe(true);
      expect(bboxIntersects(bbox2, bbox1)).toBe(true);
    });

    it("should return true when touching on the top/bottom edge", () => {
      const bbox2: BBox = { x: 10, y: 60, width: 50, height: 50 };
      expect(bboxIntersects(bbox1, bbox2)).toBe(true);
      expect(bboxIntersects(bbox2, bbox1)).toBe(true);
    });

    it("should return true when touching at a corner", () => {
      const bbox2: BBox = { x: 60, y: 60, width: 50, height: 50 };
      expect(bboxIntersects(bbox1, bbox2)).toBe(true);
      expect(bboxIntersects(bbox2, bbox1)).toBe(true);
    });
  });

  describe("non-intersecting", () => {
    it("should return false when completely to the right/left", () => {
      const bbox2: BBox = { x: 70, y: 10, width: 50, height: 50 };
      expect(bboxIntersects(bbox1, bbox2)).toBe(false);
      expect(bboxIntersects(bbox2, bbox1)).toBe(false);
    });

    it("should return false when completely below/above", () => {
      const bbox2: BBox = { x: 10, y: 70, width: 50, height: 50 };
      expect(bboxIntersects(bbox1, bbox2)).toBe(false);
      expect(bboxIntersects(bbox2, bbox1)).toBe(false);
    });

    it("should return false when diagonally separated", () => {
      const bbox2: BBox = { x: 70, y: 70, width: 50, height: 50 };
      expect(bboxIntersects(bbox1, bbox2)).toBe(false);
      expect(bboxIntersects(bbox2, bbox1)).toBe(false);
    });
  });

  describe("special bboxes", () => {
    it("should work with zero-width (vertical line)", () => {
      const line1: BBox = { x: 10, y: 10, width: 0, height: 50 };
      const line2: BBox = { x: 10, y: 30, width: 0, height: 50 };
      expect(bboxIntersects(line1, line2)).toBe(true);

      const line3: BBox = { x: 11, y: 10, width: 0, height: 50 };
      expect(bboxIntersects(line1, line3)).toBe(false);
    });

    it("should work with zero-height (horizontal line)", () => {
      const line1: BBox = { x: 10, y: 10, width: 50, height: 0 };
      const line2: BBox = { x: 30, y: 10, width: 50, height: 0 };
      expect(bboxIntersects(line1, line2)).toBe(true);

      const line3: BBox = { x: 10, y: 11, width: 50, height: 0 };
      expect(bboxIntersects(line1, line3)).toBe(false);
    });

    it("should work with zero-size (point)", () => {
      const point1: BBox = { x: 10, y: 10, width: 0, height: 0 };
      const point2: BBox = { x: 10, y: 10, width: 0, height: 0 };
      expect(bboxIntersects(point1, point2)).toBe(true);

      const point3: BBox = { x: 11, y: 10, width: 0, height: 0 };
      expect(bboxIntersects(point1, point3)).toBe(false);

      expect(bboxIntersects(bbox1, point1)).toBe(true);
    });
  });
});
