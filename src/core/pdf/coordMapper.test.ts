import { describe, expect, it } from "vitest";
import { bboxContainsPoint } from "./coordMapper";
import { BBox } from "../model/types";

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
