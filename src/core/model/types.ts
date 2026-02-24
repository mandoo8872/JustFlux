/**
 * JustFlux v2 Core Data Model
 * Local-only, page-centric document editor
 */

// ============================================
// Document & Page Structure
// ============================================

export interface Document {
  id: string;
  name: string;
  source: DocumentSource;
  pages: Page[];
  meta?: DocumentMeta;
  version: number;
  createdAt: number;
  modifiedAt: number;
}

export interface DocumentSource {
  kind: 'pdf' | 'images';
  fileName: string;
  fileSize: number;
  /** Original PDF bytes (for export) */
  originalBytes?: Uint8Array;
}

export interface DocumentMeta {
  author?: string;
  title?: string;
  subject?: string;
  keywords?: string[];
  [key: string]: unknown;
}

export interface Page {
  id: string;
  docId: string;
  index: number; // 0-based
  width: number; // pt (PDF points)
  height: number; // pt
  rotation: 0 | 90 | 180 | 270;
  pdfRef?: PdfPageRef;
  layers: PageLayers;
  thumbnail?: ThumbnailRef;
  deleted?: boolean; // Soft delete flag
  /** Text/Markdown content for text-based pages */
  textContent?: string;
  /** Image data URL for image-based pages */
  imageUrl?: string;
  /** Page content type: 'pdf' | 'blank' | 'text' | 'markdown' | 'image' */
  contentType?: 'pdf' | 'blank' | 'text' | 'markdown' | 'image';
}

export interface PdfPageRef {
  /** Reference to original PDF in Document.source */
  sourceIndex: number; // page number in original PDF (1-based)
  /** Source filename when appended from a different file */
  appendedFrom?: string;
}

export interface ThumbnailRef {
  dataUrl: string;
  scale: number;
  width: number;
  height: number;
}

// ============================================
// Layer System (Vector + Raster)
// ============================================

export interface PageLayers {
  /** Vector annotations (text, shapes, highlights) */
  annotations: Annotation[];
  /** Raster layers (brush, erase, blur, etc.) */
  rasters: RasterLayer[];
}

// ============================================
// Vector Annotations - 새로운 타입 시스템으로 통합
// ============================================

// 새로운 타입 시스템 import
import type {
  Annotation,
  BaseAnnotation,
  BBox,
  AnnotationStyle,
  TextAnnotation,
  HighlightAnnotation,
  EllipseAnnotation,
  RectangleAnnotation,
  ArrowAnnotation,
  StarAnnotation,
  HeartAnnotation,
  LightningAnnotation,
  ImageAnnotation,
  StampAnnotation,
  OCRAnnotation,
  AIAnnotation
} from '../../types/annotation';

export type {
  Annotation,
  BaseAnnotation,
  BBox,
  AnnotationStyle,
  TextAnnotation,
  HighlightAnnotation,
  EllipseAnnotation,
  RectangleAnnotation,
  ArrowAnnotation,
  StarAnnotation,
  HeartAnnotation,
  LightningAnnotation,
  ImageAnnotation,
  StampAnnotation,
  OCRAnnotation,
  AIAnnotation
};

// Point 타입 (단일 정의 - 중복 제거)
export interface Point {
  x: number;
  y: number;
}

// 기존 코드 호환성을 위한 별칭
export type AnnotationType = 'text' | 'highlight' | 'rect' | 'ellipse' | 'arrow' | 'line' | 'star' | 'heart' | 'lightning' | 'image' | 'stamp';

// Import한 타입을 다시 export하여 사용 가능하게 함
import type { RectangleAnnotation as RectangleAnnotationType, ArrowAnnotation as ArrowAnnotationType } from '../../types/annotation';
export type RectAnnotation = RectangleAnnotationType;
export type LineAnnotation = ArrowAnnotationType; // Line은 Arrow로 통합

// ============================================
// Raster Layer System
// ============================================

export type RasterLayerKind = 'freedraw' | 'erase' | 'blur' | 'mask';

export interface RasterLayer {
  id: string;
  pageId: string;
  kind: RasterLayerKind;
  visible: boolean;
  opacity: number; // 0-1
  blendMode?: BlendMode;
  /** Canvas data URL or OffscreenCanvas reference */
  canvasData?: string;
  /** Recording of operations (for undo/replay) */
  operations: RasterOperation[];
  createdAt: number;
  modifiedAt: number;
}

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten';

export interface RasterOperation {
  id: string;
  kind: 'stroke' | 'erase' | 'blur' | 'fill';
  tool: BrushTool | EraseTool | BlurTool;
  points: Point[];
  timestamp: number;
}

export interface BrushTool {
  type: 'brush';
  size: number;
  hardness: number; // 0-1
  opacity: number; // 0-1
  color: string; // hex
}

export interface EraseTool {
  type: 'eraser';
  size: number;
  hardness: number;
}

export interface BlurTool {
  type: 'blur';
  size: number;
  strength: number; // 0-1
}



export interface Transform {
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
  rotation: number; // degrees
}

// ============================================
// History & Undo/Redo
// ============================================

export interface HistoryState {
  patches: HistoryPatch[];
  currentIndex: number;
  maxSize: number; // default 50
}

// Note: We use fast-json-patch's Operation type directly
// Import it where needed: import { Operation } from 'fast-json-patch';
export interface HistoryPatch {
  id: string;
  timestamp: number;
  description: string;
  forward: unknown[]; // JSON Patch operations (use fast-json-patch.Operation)
  backward: unknown[]; // Reverse operations (use fast-json-patch.Operation)
}

// ============================================
// Tool & Selection State
// ============================================

export type ToolType =
  | 'select'
  | 'pan'
  | 'text'
  | 'highlight'
  | 'highlighter' // 형광펜 자유 드로잉
  | 'rectangle' // 'rect'에서 'rectangle'으로 변경
  | 'roundedRect' // 둥근 사각형
  | 'ellipse'
  | 'arrow'
  | 'line' // 직선 도구 추가
  | 'star'
  | 'heart'
  | 'lightning'
  | 'brush'
  | 'eraser'
  | 'zoom'
  | 'crop'
  | 'copy'
  | 'sticker'
  | 'blur';

export interface SelectionState {
  selectedPageId: string | null;
  selectedAnnotationIds: string[];
  selectedRasterLayerId: string | null;
  activeTool: ToolType;
  toolOptions: ToolOptions;
}

export interface ToolOptions {
  brush?: BrushTool;
  eraser?: EraseTool;
  blur?: BlurTool;
  annotationStyle?: AnnotationStyleOptions;
}

export interface AnnotationStyleOptions {
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  fontSize?: number;
  fontFamily?: string;
  opacity?: number;
}

// ============================================
// Export Options
// ============================================

export interface ExportOptions {
  format: 'pdf' | 'png' | 'jpeg' | 'tiff';
  quality?: number; // 0-1 for lossy formats
  dpi?: number; // default 300
  pages?: number[] | 'all' | 'current'; // page indices or 'all'
  includeAnnotations?: boolean;
  includeRasterLayers?: boolean;
  flattenLayers?: boolean; // merge all layers
}

// ============================================
// View State
// ============================================

export interface ViewState {
  zoom: number; // scale factor (1.0 = 100%)
  panX: number;
  panY: number;
  fitMode: 'width' | 'height' | 'page' | 'custom';
  showGrid?: boolean;
  showRulers?: boolean;
  snapToGrid?: boolean;
}

