/**
 * Annotation Type System - Discriminated Union 기반
 * 구조적 안정성과 확장성을 위한 타입 시스템
 */

// ============================================
// Base Annotation Interface
// ============================================

export interface BaseAnnotation {
  id: string;
  type: string;
  bbox: BBox;
  pageId: string;
  createdAt: number;
  modifiedAt: number;
  style: AnnotationStyle;
}

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnnotationStyle {
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string; // SVG dash pattern: '4 4', '12 4', '2 2', etc.
  fill?: string;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  textDecoration?: string;
  // Text-specific colors
  color?: string;
  backgroundColor?: string;
  backgroundOpacity?: number; // 0-1, background transparency
  borderColor?: string;
  borderWidth?: number; // border thickness in px
  // Image-specific
  lockAspectRatio?: boolean;
}

// ============================================
// Text Annotation Types
// ============================================

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  content: string;
  style: AnnotationStyle & {
    fontSize: number;
    fontFamily: string;
  };
}

export interface HighlightAnnotation extends BaseAnnotation {
  type: 'highlight';
  content: string;
  opacity?: number;
  style: AnnotationStyle & {
    fill: string;
    opacity: number;
  };
}

// ============================================
// Shape Annotation Types
// ============================================

export interface EllipseAnnotation extends BaseAnnotation {
  type: 'ellipse';
  // Arc editing (Figma UI3 style)
  startAngle?: number;      // 0-360, arc start position (default: 0)
  sweepAngle?: number;      // 0-360, arc sweep angle (default: 360 = full circle)
  innerRadiusRatio?: number; // 0-1, inner radius as ratio of outer radius (default: 0, 1 = thinnest ring)
  style: AnnotationStyle & {
    fill: string;
    stroke: string;
    strokeWidth: number;
  };
}

export interface RectangleAnnotation extends BaseAnnotation {
  type: 'rectangle';
  cornerRadius?: number;
  style: AnnotationStyle & {
    fill: string;
    stroke: string;
    strokeWidth: number;
  };
}

export interface RoundedRectAnnotation extends BaseAnnotation {
  type: 'roundedRect';
  cornerRadius: number;
  style: AnnotationStyle & {
    fill: string;
    stroke: string;
    strokeWidth: number;
  };
}

export interface ArrowAnnotation extends BaseAnnotation {
  type: 'arrow';
  startPoint: Point;
  endPoint: Point;
  arrowHeadSize?: number;
  style: AnnotationStyle & {
    stroke: string;
    strokeWidth: number;
  };
}

export interface LineAnnotation extends BaseAnnotation {
  type: 'line';
  startPoint: Point;
  endPoint: Point;
  style: AnnotationStyle & {
    stroke: string;
    strokeWidth: number;
  };
}

export interface StarAnnotation extends BaseAnnotation {
  type: 'star';
  points: Point[];
  innerRadius?: number;
  style: AnnotationStyle & {
    fill: string;
    stroke: string;
    strokeWidth: number;
  };
}

export interface HeartAnnotation extends BaseAnnotation {
  type: 'heart';
  style: AnnotationStyle & {
    fill: string;
    stroke: string;
    strokeWidth: number;
  };
}

export interface LightningAnnotation extends BaseAnnotation {
  type: 'lightning';
  points: Point[];
  style: AnnotationStyle & {
    fill: string;
    stroke: string;
    strokeWidth: number;
  };
}

export interface FreehandAnnotation extends BaseAnnotation {
  type: 'freehand';
  points: Point[];
  style: AnnotationStyle & {
    stroke: string;
    strokeWidth: number;
  };
}

export interface HighlighterAnnotation extends BaseAnnotation {
  type: 'highlighter';
  points: Point[];
  style: AnnotationStyle & {
    stroke: string;
    strokeWidth: number;
    opacity: number;
  };
}

// ============================================
// Image Annotation Types
// ============================================

export interface ImageAnnotation extends BaseAnnotation {
  type: 'image';
  imageData: string; // base64 or URL
  originalWidth: number;
  originalHeight: number;
  style: AnnotationStyle;
}

// ============================================
// Stamp Annotation Types
// ============================================

export interface StampAnnotation extends BaseAnnotation {
  type: 'stamp';
  stampType: 'approved' | 'rejected' | 'pending' | 'custom';
  content?: string;
  style: AnnotationStyle & {
    fill: string;
    stroke: string;
    strokeWidth: number;
  };
}

// ============================================
// OCR Annotation Types (미래 확장)
// ============================================

export interface OCRAnnotation extends BaseAnnotation {
  type: 'ocr';
  content: string;
  confidence: number;
  language: string;
  style: AnnotationStyle & {
    fontSize: number;
    fontFamily: string;
  };
}

// ============================================
// AI Annotation Types (미래 확장)
// ============================================

export interface AIAnnotation extends BaseAnnotation {
  type: 'ai';
  aiType: 'summary' | 'translation' | 'analysis';
  content: string;
  confidence: number;
  model: string;
  style: AnnotationStyle & {
    fontSize: number;
    fontFamily: string;
  };
}

// ============================================
// Utility Types
// ============================================

export interface Point {
  x: number;
  y: number;
}

// ============================================
// Discriminated Union
// ============================================

export type Annotation =
  | TextAnnotation
  | HighlightAnnotation
  | EllipseAnnotation
  | RectangleAnnotation
  | RoundedRectAnnotation
  | ArrowAnnotation
  | LineAnnotation
  | StarAnnotation
  | HeartAnnotation
  | LightningAnnotation
  | FreehandAnnotation
  | HighlighterAnnotation
  | ImageAnnotation
  | StampAnnotation
  | OCRAnnotation
  | AIAnnotation;

// ============================================
// Type Guards
// ============================================

export function isTextAnnotation(annotation: Annotation): annotation is TextAnnotation {
  return annotation.type === 'text';
}

export function isHighlightAnnotation(annotation: Annotation): annotation is HighlightAnnotation {
  return annotation.type === 'highlight';
}

export function isShapeAnnotation(annotation: Annotation): annotation is
  | EllipseAnnotation
  | RectangleAnnotation
  | ArrowAnnotation
  | LineAnnotation
  | StarAnnotation
  | HeartAnnotation
  | LightningAnnotation
  | FreehandAnnotation {
  return ['ellipse', 'rectangle', 'arrow', 'line', 'star', 'heart', 'lightning', 'freehand'].includes(annotation.type);
}

export function isFreehandAnnotation(annotation: Annotation): annotation is FreehandAnnotation {
  return annotation.type === 'freehand';
}

export function isHighlighterAnnotation(annotation: Annotation): annotation is HighlighterAnnotation {
  return annotation.type === 'highlighter';
}

export function isImageAnnotation(annotation: Annotation): annotation is ImageAnnotation {
  return annotation.type === 'image';
}

export function isStampAnnotation(annotation: Annotation): annotation is StampAnnotation {
  return annotation.type === 'stamp';
}

export function isOCRAnnotation(annotation: Annotation): annotation is OCRAnnotation {
  return annotation.type === 'ocr';
}

export function isAIAnnotation(annotation: Annotation): annotation is AIAnnotation {
  return annotation.type === 'ai';
}

// ============================================
// Render Props Interface
// ============================================

export interface AnnotationRenderProps {
  annotation: Annotation;
  isSelected: boolean;
  isHovered: boolean;
  scale: number;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Annotation>) => void;
  onDelete: (id: string) => void;
  onHover?: (id: string) => void;
  onHoverEnd?: (id: string) => void;
}
