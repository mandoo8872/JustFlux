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
}

export interface PdfPageRef {
  /** Reference to original PDF in Document.source */
  sourceIndex: number; // page number in original PDF (1-based)
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
// Vector Annotations
// ============================================

export type AnnotationType =
  | 'text'
  | 'highlight'
  | 'rect'
  | 'ellipse'
  | 'arrow'
  | 'line'
  | 'star'
  | 'heart'
  | 'lightning'
  | 'image'
  | 'stamp';

export interface BaseAnnotation {
  id: string;
  type: AnnotationType;
  pageId: string;
  bbox: BBox; // [x, y, width, height] in PDF points
  style?: AnnotationStyle;
  locked?: boolean;
  opacity?: number; // 0-1
  createdAt: number;
  modifiedAt: number;
}

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnnotationStyle {
  stroke?: string; // hex color
  strokeWidth?: number;
  fill?: string; // hex color
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
}

// Specific annotation types
export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  content: string;
  style: Required<Pick<AnnotationStyle, 'fontFamily' | 'fontSize'>> & AnnotationStyle;
}

export interface HighlightAnnotation extends BaseAnnotation {
  type: 'highlight';
  style: Required<Pick<AnnotationStyle, 'fill'>> & AnnotationStyle;
}

export interface RectAnnotation extends BaseAnnotation {
  type: 'rect';
  cornerRadius?: number;
}

export interface EllipseAnnotation extends BaseAnnotation {
  type: 'ellipse';
}

export interface ArrowAnnotation extends BaseAnnotation {
  type: 'arrow';
  startPoint: Point;
  endPoint: Point;
  arrowHeadSize?: number;
}

export interface LineAnnotation extends BaseAnnotation {
  type: 'line';
  startPoint: Point;
  endPoint: Point;
}

export interface StarAnnotation extends BaseAnnotation {
  type: 'star';
  points: number; // number of star points (5, 6, 8, etc.)
  innerRadius?: number; // ratio of inner radius to outer radius
}

export interface HeartAnnotation extends BaseAnnotation {
  type: 'heart';
  // Heart shape is defined by bbox
}

export interface LightningAnnotation extends BaseAnnotation {
  type: 'lightning';
  // Lightning shape is defined by bbox
}

export interface ImageAnnotation extends BaseAnnotation {
  type: 'image';
  imageData: string; // base64 or blob URL
  originalWidth: number;
  originalHeight: number;
}

export interface StampAnnotation extends BaseAnnotation {
  type: 'stamp';
  stampType: 'approved' | 'rejected' | 'draft' | 'confidential' | 'custom';
  text?: string;
}

export type Annotation =
  | TextAnnotation
  | HighlightAnnotation
  | RectAnnotation
  | EllipseAnnotation
  | ArrowAnnotation
  | LineAnnotation
  | StarAnnotation
  | HeartAnnotation
  | LightningAnnotation
  | ImageAnnotation
  | StampAnnotation;

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

// ============================================
// Geometry & Transforms
// ============================================

export interface Point {
  x: number;
  y: number;
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
  | 'rect'
  | 'ellipse'
  | 'arrow'
  | 'line'
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
  annotationStyle?: AnnotationStyle;
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

