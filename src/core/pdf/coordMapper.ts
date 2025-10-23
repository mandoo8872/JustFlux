/**
 * Coordinate transformation utilities
 * Centralizes all PDF ↔ Viewport ↔ Canvas coordinate conversions
 */

import type { PageViewport } from 'pdfjs-dist';
import type { BBox } from '../model/types';

/**
 * Transform PDF user space bbox to viewport coordinates
 * PDF: bottom-left origin, Viewport: top-left origin
 */
export function pdfToViewport(bbox: BBox, viewport: PageViewport): BBox {
  const { x: x1, y: y1, width, height } = bbox;
  const x2 = x1 + width;
  const y2 = y1 + height;
  
  // PDF.js viewport transform handles rotation and scaling
  const [vx1, vy1] = viewport.convertToViewportPoint(x1, y1);
  const [vx2, vy2] = viewport.convertToViewportPoint(x2, y2);
  
  return {
    x: Math.min(vx1, vx2),
    y: Math.min(vy1, vy2),
    width: Math.abs(vx2 - vx1),
    height: Math.abs(vy2 - vy1),
  };
}

/**
 * Transform viewport bbox to canvas pixel coordinates
 */
export function viewportToCanvas(bbox: BBox, _canvas: HTMLCanvasElement): BBox {
  // Canvas and viewport have same coordinate system
  return bbox;
}

/**
 * Transform canvas bbox to viewport coordinates
 */
export function canvasToViewport(bbox: BBox, _canvas: HTMLCanvasElement): BBox {
  return bbox;
}

/**
 * Ensure bbox has positive width and height
 */
export function normalizeBBox(bbox: BBox): BBox {
  return {
    x: bbox.x,
    y: bbox.y,
    width: Math.abs(bbox.width),
    height: Math.abs(bbox.height),
  };
}

/**
 * Check if bbox contains point
 */
export function bboxContainsPoint(bbox: BBox, x: number, y: number): boolean {
  return (
    x >= bbox.x &&
    x <= bbox.x + bbox.width &&
    y >= bbox.y &&
    y <= bbox.y + bbox.height
  );
}

/**
 * Check if two bboxes intersect
 */
export function bboxIntersects(a: BBox, b: BBox): boolean {
  const ax2 = a.x + a.width;
  const ay2 = a.y + a.height;
  const bx2 = b.x + b.width;
  const by2 = b.y + b.height;
  
  return !(
    ax2 < b.x || // a is left of b
    bx2 < a.x || // b is left of a
    ay2 < b.y || // a is above b
    by2 < a.y    // b is above a
  );
}

/**
 * Translate bbox by dx, dy
 */
export function translateBBox(bbox: BBox, dx: number, dy: number): BBox {
  return {
    x: bbox.x + dx,
    y: bbox.y + dy,
    width: bbox.width,
    height: bbox.height,
  };
}

/**
 * Scale bbox by sx, sy
 */
export function scaleBBox(bbox: BBox, sx: number, sy: number): BBox {
  return {
    x: bbox.x * sx,
    y: bbox.y * sy,
    width: bbox.width * sx,
    height: bbox.height * sy,
  };
}

/**
 * Expand bbox by padding
 */
export function expandBBox(bbox: BBox, padding: number): BBox {
  return {
    x: bbox.x - padding,
    y: bbox.y - padding,
    width: bbox.width + padding * 2,
    height: bbox.height + padding * 2,
  };
}

/**
 * Union of two bboxes
 */
export function unionBBox(a: BBox, b: BBox): BBox {
  const ax2 = a.x + a.width;
  const ay2 = a.y + a.height;
  const bx2 = b.x + b.width;
  const by2 = b.y + b.height;
  
  const x1 = Math.min(a.x, b.x);
  const y1 = Math.min(a.y, b.y);
  const x2 = Math.max(ax2, bx2);
  const y2 = Math.max(ay2, by2);
  
  return {
    x: x1,
    y: y1,
    width: x2 - x1,
    height: y2 - y1,
  };
}

/**
 * Convert screen coordinates to viewport coordinates
 */
export function screenToViewport(
  coord: { x: number; y: number },
  element: HTMLElement
): [number, number] {
  const rect = element.getBoundingClientRect();
  return [coord.x - rect.left, coord.y - rect.top];
}
