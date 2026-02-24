/**
 * Service Tokens - 의존성 주입을 위한 서비스 토큰들
 * 확장 가능한 서비스 토큰 시스템
 */

import type { ServiceToken } from './Container';

// ============================================
// 핵심 서비스 토큰
// ============================================

export const EVENT_BUS_TOKEN: ServiceToken = Symbol('EventBus');
export const EVENT_SERVICE_TOKEN: ServiceToken = Symbol('EventService');
export const DOCUMENT_STORE_TOKEN: ServiceToken = Symbol('DocumentStore');
export const ANNOTATION_STORE_TOKEN: ServiceToken = Symbol('AnnotationStore');
export const VIEW_STORE_TOKEN: ServiceToken = Symbol('ViewStore');
export const HISTORY_STORE_TOKEN: ServiceToken = Symbol('HistoryStore');
export const LAYER_STORE_TOKEN: ServiceToken = Symbol('LayerStore');
export const EXPORT_STORE_TOKEN: ServiceToken = Symbol('ExportStore');

// ============================================
// PDF 관련 서비스 토큰
// ============================================

export const PDF_LOADER_TOKEN: ServiceToken = Symbol('PDFLoader');
export const PDF_RENDERER_TOKEN: ServiceToken = Symbol('PDFRenderer');
export const PDF_EXPORTER_TOKEN: ServiceToken = Symbol('PDFExporter');

// ============================================
// 주석 관련 서비스 토큰
// ============================================

export const ANNOTATION_RENDERER_TOKEN: ServiceToken = Symbol('AnnotationRenderer');
export const ANNOTATION_VALIDATOR_TOKEN: ServiceToken = Symbol('AnnotationValidator');
export const ANNOTATION_SERIALIZER_TOKEN: ServiceToken = Symbol('AnnotationSerializer');

// ============================================
// 내보내기 관련 서비스 토큰
// ============================================

export const EXPORT_MANAGER_TOKEN: ServiceToken = Symbol('ExportManager');
export const PDF_EXPORT_SERVICE_TOKEN: ServiceToken = Symbol('PDFExportService');
export const IMAGE_EXPORT_SERVICE_TOKEN: ServiceToken = Symbol('ImageExportService');
export const SVG_EXPORT_SERVICE_TOKEN: ServiceToken = Symbol('SVGExportService');

// ============================================
// AI 관련 서비스 토큰 (미래 확장)
// ============================================

export const AI_ENGINE_TOKEN: ServiceToken = Symbol('AIEngine');
export const OCR_SERVICE_TOKEN: ServiceToken = Symbol('OCRService');
export const NLP_SERVICE_TOKEN: ServiceToken = Symbol('NLPService');
export const IMAGE_ANALYSIS_SERVICE_TOKEN: ServiceToken = Symbol('ImageAnalysisService');

// ============================================
// 유틸리티 서비스 토큰
// ============================================

export const FILE_MANAGER_TOKEN: ServiceToken = Symbol('FileManager');
export const STORAGE_MANAGER_TOKEN: ServiceToken = Symbol('StorageManager');
export const NOTIFICATION_SERVICE_TOKEN: ServiceToken = Symbol('NotificationService');
export const LOGGER_SERVICE_TOKEN: ServiceToken = Symbol('LoggerService');

// ============================================
// 플러그인 관련 서비스 토큰
// ============================================

export const PLUGIN_MANAGER_TOKEN: ServiceToken = Symbol('PluginManager');
export const THEME_MANAGER_TOKEN: ServiceToken = Symbol('ThemeManager');
export const SHORTCUT_MANAGER_TOKEN: ServiceToken = Symbol('ShortcutManager');

// ============================================
// 서비스 토큰 맵
// ============================================

export const SERVICE_TOKENS = {
  // 핵심 서비스
  EVENT_BUS: EVENT_BUS_TOKEN,
  EVENT_SERVICE: EVENT_SERVICE_TOKEN,
  DOCUMENT_STORE: DOCUMENT_STORE_TOKEN,
  ANNOTATION_STORE: ANNOTATION_STORE_TOKEN,
  VIEW_STORE: VIEW_STORE_TOKEN,
  HISTORY_STORE: HISTORY_STORE_TOKEN,
  LAYER_STORE: LAYER_STORE_TOKEN,
  EXPORT_STORE: EXPORT_STORE_TOKEN,
  
  // PDF 서비스
  PDF_LOADER: PDF_LOADER_TOKEN,
  PDF_RENDERER: PDF_RENDERER_TOKEN,
  PDF_EXPORTER: PDF_EXPORTER_TOKEN,
  
  // 주석 서비스
  ANNOTATION_RENDERER: ANNOTATION_RENDERER_TOKEN,
  ANNOTATION_VALIDATOR: ANNOTATION_VALIDATOR_TOKEN,
  ANNOTATION_SERIALIZER: ANNOTATION_SERIALIZER_TOKEN,
  
  // 내보내기 서비스
  EXPORT_MANAGER: EXPORT_MANAGER_TOKEN,
  PDF_EXPORT_SERVICE: PDF_EXPORT_SERVICE_TOKEN,
  IMAGE_EXPORT_SERVICE: IMAGE_EXPORT_SERVICE_TOKEN,
  SVG_EXPORT_SERVICE: SVG_EXPORT_SERVICE_TOKEN,
  
  // AI 서비스
  AI_ENGINE: AI_ENGINE_TOKEN,
  OCR_SERVICE: OCR_SERVICE_TOKEN,
  NLP_SERVICE: NLP_SERVICE_TOKEN,
  IMAGE_ANALYSIS_SERVICE: IMAGE_ANALYSIS_SERVICE_TOKEN,
  
  // 유틸리티 서비스
  FILE_MANAGER: FILE_MANAGER_TOKEN,
  STORAGE_MANAGER: STORAGE_MANAGER_TOKEN,
  NOTIFICATION_SERVICE: NOTIFICATION_SERVICE_TOKEN,
  LOGGER_SERVICE: LOGGER_SERVICE_TOKEN,
  
  // 플러그인 서비스
  PLUGIN_MANAGER: PLUGIN_MANAGER_TOKEN,
  THEME_MANAGER: THEME_MANAGER_TOKEN,
  SHORTCUT_MANAGER: SHORTCUT_MANAGER_TOKEN
} as const;
