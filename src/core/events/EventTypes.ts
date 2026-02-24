/**
 * Event Types - 이벤트 시스템 타입 정의
 * 확장 가능한 이벤트 타입 시스템
 */

import type { Annotation, Page, Document } from '../model/types';

// EventCallback 타입 정의
export type EventCallback<T = any> = (data: T) => void;

// ============================================
// 주석 관련 이벤트
// ============================================

export interface AnnotationCreatedEvent {
  annotation: Annotation;
  pageId: string;
  timestamp: number;
}

export interface AnnotationUpdatedEvent {
  annotationId: string;
  updates: Partial<Annotation>;
  pageId: string;
  timestamp: number;
}

export interface AnnotationDeletedEvent {
  annotationId: string;
  pageId: string;
  timestamp: number;
}

export interface AnnotationSelectedEvent {
  annotationIds: string[];
  pageId: string;
  timestamp: number;
}

export interface AnnotationHoveredEvent {
  annotationId: string | null;
  pageId: string;
  timestamp: number;
}

// ============================================
// 페이지 관련 이벤트
// ============================================

export interface PageCreatedEvent {
  page: Page;
  documentId: string;
  timestamp: number;
}

export interface PageUpdatedEvent {
  pageId: string;
  updates: Partial<Page>;
  documentId: string;
  timestamp: number;
}

export interface PageDeletedEvent {
  pageId: string;
  documentId: string;
  timestamp: number;
}

export interface PageSelectedEvent {
  pageId: string;
  documentId: string;
  timestamp: number;
}

export interface PageReorderedEvent {
  pageIds: string[];
  documentId: string;
  timestamp: number;
}

// ============================================
// 문서 관련 이벤트
// ============================================

export interface DocumentLoadedEvent {
  document: Document;
  timestamp: number;
}

export interface DocumentSavedEvent {
  document: Document;
  timestamp: number;
}

export interface DocumentClosedEvent {
  documentId: string;
  timestamp: number;
}

// ============================================
// 뷰 관련 이벤트
// ============================================

export interface ViewChangedEvent {
  zoom: number;
  panX: number;
  panY: number;
  timestamp: number;
}

export interface ToolChangedEvent {
  tool: string;
  previousTool: string;
  timestamp: number;
}

// ============================================
// 히스토리 관련 이벤트
// ============================================

export interface HistoryUndoEvent {
  action: string;
  timestamp: number;
}

export interface HistoryRedoEvent {
  action: string;
  timestamp: number;
}

export interface HistoryClearedEvent {
  timestamp: number;
}

// ============================================
// 내보내기 관련 이벤트
// ============================================

export interface ExportStartedEvent {
  format: string;
  options: any;
  timestamp: number;
}

export interface ExportProgressEvent {
  progress: number;
  format: string;
  timestamp: number;
}

export interface ExportCompletedEvent {
  format: string;
  result: any;
  timestamp: number;
}

export interface ExportFailedEvent {
  format: string;
  error: string;
  timestamp: number;
}

// ============================================
// 레이어 관련 이벤트
// ============================================

export interface LayerCreatedEvent {
  layerId: string;
  layerType: string;
  timestamp: number;
}

export interface LayerUpdatedEvent {
  layerId: string;
  updates: any;
  timestamp: number;
}

export interface LayerDeletedEvent {
  layerId: string;
  timestamp: number;
}

export interface LayerReorderedEvent {
  layerIds: string[];
  timestamp: number;
}

// ============================================
// AI 관련 이벤트 (미래 확장)
// ============================================

export interface AIAnalysisStartedEvent {
  type: string;
  data: any;
  timestamp: number;
}

export interface AIAnalysisCompletedEvent {
  type: string;
  result: any;
  timestamp: number;
}

export interface AIAnalysisFailedEvent {
  type: string;
  error: string;
  timestamp: number;
}

// ============================================
// 이벤트 타입 유니온
// ============================================

export type AppEvent = 
  | AnnotationCreatedEvent
  | AnnotationUpdatedEvent
  | AnnotationDeletedEvent
  | AnnotationSelectedEvent
  | AnnotationHoveredEvent
  | PageCreatedEvent
  | PageUpdatedEvent
  | PageDeletedEvent
  | PageSelectedEvent
  | PageReorderedEvent
  | DocumentLoadedEvent
  | DocumentSavedEvent
  | DocumentClosedEvent
  | ViewChangedEvent
  | ToolChangedEvent
  | HistoryUndoEvent
  | HistoryRedoEvent
  | HistoryClearedEvent
  | ExportStartedEvent
  | ExportProgressEvent
  | ExportCompletedEvent
  | ExportFailedEvent
  | LayerCreatedEvent
  | LayerUpdatedEvent
  | LayerDeletedEvent
  | LayerReorderedEvent
  | AIAnalysisStartedEvent
  | AIAnalysisCompletedEvent
  | AIAnalysisFailedEvent;

// ============================================
// 이벤트 상수
// ============================================

export const EVENTS = {
  // 주석 이벤트
  ANNOTATION_CREATED: 'annotation:created',
  ANNOTATION_UPDATED: 'annotation:updated',
  ANNOTATION_DELETED: 'annotation:deleted',
  ANNOTATION_SELECTED: 'annotation:selected',
  ANNOTATION_HOVERED: 'annotation:hovered',
  
  // 페이지 이벤트
  PAGE_CREATED: 'page:created',
  PAGE_UPDATED: 'page:updated',
  PAGE_DELETED: 'page:deleted',
  PAGE_SELECTED: 'page:selected',
  PAGE_REORDERED: 'page:reordered',
  
  // 문서 이벤트
  DOCUMENT_LOADED: 'document:loaded',
  DOCUMENT_SAVED: 'document:saved',
  DOCUMENT_CLOSED: 'document:closed',
  
  // 뷰 이벤트
  VIEW_CHANGED: 'view:changed',
  TOOL_CHANGED: 'tool:changed',
  
  // 히스토리 이벤트
  HISTORY_UNDO: 'history:undo',
  HISTORY_REDO: 'history:redo',
  HISTORY_CLEARED: 'history:cleared',
  
  // 내보내기 이벤트
  EXPORT_STARTED: 'export:started',
  EXPORT_PROGRESS: 'export:progress',
  EXPORT_COMPLETED: 'export:completed',
  EXPORT_FAILED: 'export:failed',
  
  // 레이어 이벤트
  LAYER_CREATED: 'layer:created',
  LAYER_UPDATED: 'layer:updated',
  LAYER_DELETED: 'layer:deleted',
  LAYER_REORDERED: 'layer:reordered',
  
  // AI 이벤트
  AI_ANALYSIS_STARTED: 'ai:analysis:started',
  AI_ANALYSIS_COMPLETED: 'ai:analysis:completed',
  AI_ANALYSIS_FAILED: 'ai:analysis:failed'
} as const;
