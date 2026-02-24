/**
 * Factory functions for creating model objects
 * Ensures consistent initialization and default values
 */

import type {
  Document,
  Page,
  Annotation,
  TextAnnotation,
  HighlightAnnotation,
  RectAnnotation,
  ImageAnnotation,
  RasterLayer,
  BBox,
  AnnotationStyle,
  HistoryPatch,
} from './types';
import type { Operation } from 'fast-json-patch';

// ============================================
// Document Factories
// ============================================

export function createDocument(params: {
  name: string;
  source: Document['source'];
  pages?: Page[];
}): Document {
  const now = Date.now();
  return {
    id: `doc-${now}-${Math.random().toString(36).slice(2, 9)}`,
    name: params.name,
    source: params.source,
    pages: params.pages || [],
    version: 1,
    createdAt: now,
    modifiedAt: now,
  };
}

export function createPage(params: {
  docId: string;
  index: number;
  width: number;
  height: number;
  rotation?: 0 | 90 | 180 | 270;
  pdfRef?: Page['pdfRef'];
  contentType?: 'pdf' | 'blank' | 'text' | 'markdown' | 'image';
}): Page {
  return {
    id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    docId: params.docId,
    index: params.index,
    width: params.width,
    height: params.height,
    rotation: params.rotation || 0,
    pdfRef: params.pdfRef,
    contentType: params.contentType || (params.pdfRef ? 'pdf' : 'blank'),
    layers: {
      annotations: [],
      rasters: [],
    },
  };
}

// ============================================
// Annotation Factories
// ============================================

const DEFAULT_STYLE: AnnotationStyle = {
  stroke: '#000000',
  strokeWidth: 2,
  fill: '#FFFF00',
  fontFamily: 'sans-serif',
  fontSize: 16,
  fontWeight: 'normal',
  textAlign: 'left',
};

function createBaseAnnotation(params: {
  type: Annotation['type'];
  pageId: string;
  bbox: BBox;
  style?: AnnotationStyle;
}): Pick<Annotation, 'id' | 'type' | 'pageId' | 'bbox' | 'style' | 'createdAt' | 'modifiedAt'> {
  const now = Date.now();
  return {
    id: `ann-${now}-${Math.random().toString(36).slice(2, 9)}`,
    type: params.type,
    pageId: params.pageId,
    bbox: params.bbox,
    style: { ...DEFAULT_STYLE, ...params.style },
    createdAt: now,
    modifiedAt: now,
  };
}

export function createTextAnnotation(params: {
  pageId: string;
  bbox: BBox;
  content: string;
  style?: AnnotationStyle;
}): TextAnnotation {
  return {
    ...createBaseAnnotation({ ...params, type: 'text' }),
    type: 'text',
    content: params.content,
    style: {
      fontFamily: params.style?.fontFamily || DEFAULT_STYLE.fontFamily!,
      fontSize: params.style?.fontSize || DEFAULT_STYLE.fontSize!,
      ...params.style,
    },
  };
}

export function createHighlightAnnotation(params: {
  pageId: string;
  bbox: BBox;
  color?: string;
}): HighlightAnnotation {
  return {
    ...createBaseAnnotation({
      type: 'highlight',
      pageId: params.pageId,
      bbox: params.bbox,
      style: { fill: params.color || '#FFFF00' },
    }),
    type: 'highlight',
    content: '', // HighlightAnnotation에 content 속성 추가
    opacity: 0.3,
    style: {
      fill: params.color || '#FFFF00',
      opacity: 0.3,
    },
  };
}

export function createRectAnnotation(params: {
  pageId: string;
  bbox: BBox;
  cornerRadius?: number;
  style?: AnnotationStyle;
}): RectAnnotation {
  return {
    ...createBaseAnnotation({ ...params, type: 'rectangle' }),
    type: 'rectangle',
    cornerRadius: params.cornerRadius || 0,
    style: {
      fill: params.style?.fill || '#FFFFFF',
      stroke: params.style?.stroke || '#000000',
      strokeWidth: params.style?.strokeWidth || 2,
      ...params.style,
    },
  };
}

export function createImageAnnotation(params: {
  pageId: string;
  bbox: BBox;
  imageData: string;
  originalWidth: number;
  originalHeight: number;
}): ImageAnnotation {
  return {
    ...createBaseAnnotation({ ...params, type: 'image' }),
    type: 'image',
    imageData: params.imageData,
    originalWidth: params.originalWidth,
    originalHeight: params.originalHeight,
  };
}

// ============================================
// Raster Layer Factories
// ============================================

export function createRasterLayer(params: {
  pageId: string;
  kind: RasterLayer['kind'];
  opacity?: number;
}): RasterLayer {
  const now = Date.now();
  return {
    id: `raster-${now}-${Math.random().toString(36).slice(2, 9)}`,
    pageId: params.pageId,
    kind: params.kind,
    visible: true,
    opacity: params.opacity ?? 1.0,
    operations: [],
    createdAt: now,
    modifiedAt: now,
  };
}

// ============================================
// History Factories
// ============================================

export function createHistoryPatch(params: {
  description: string;
  forward: Operation[];
  backward: Operation[];
}): HistoryPatch {
  return {
    id: `patch-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
    description: params.description,
    forward: params.forward,
    backward: params.backward,
  };
}

// ============================================
// Utility Functions
// ============================================

export function createBBox(x: number, y: number, width: number, height: number): BBox {
  return { x, y, width, height };
}

export function cloneBBox(bbox: BBox): BBox {
  return { ...bbox };
}

export function expandBBox(bbox: BBox, padding: number): BBox {
  return {
    x: bbox.x - padding,
    y: bbox.y - padding,
    width: bbox.width + padding * 2,
    height: bbox.height + padding * 2,
  };
}

export function bboxContainsPoint(bbox: BBox, x: number, y: number): boolean {
  return (
    x >= bbox.x &&
    x <= bbox.x + bbox.width &&
    y >= bbox.y &&
    y <= bbox.y + bbox.height
  );
}

export function bboxIntersects(a: BBox, b: BBox): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

