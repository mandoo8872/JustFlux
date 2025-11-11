/**
 * Event Bus - 이벤트 기반 아키텍처
 * 컴포넌트 간 느슨한 결합을 위한 이벤트 시스템
 */

export type EventCallback<T = any> = (data: T) => void;

export interface EventBus {
  on<T = any>(event: string, callback: EventCallback<T>): void;
  off<T = any>(event: string, callback: EventCallback<T>): void;
  emit<T = any>(event: string, data?: T): void;
  once<T = any>(event: string, callback: EventCallback<T>): void;
  clear(): void;
}

class EventBusImpl implements EventBus {
  private listeners = new Map<string, Set<EventCallback>>();

  on<T = any>(event: string, callback: EventCallback<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off<T = any>(event: string, callback: EventCallback<T>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit<T = any>(event: string, data?: T): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ [EventBus] Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  once<T = any>(event: string, callback: EventCallback<T>): void {
    const onceCallback: EventCallback<T> = (data) => {
      callback(data);
      this.off(event, onceCallback);
    };
    this.on(event, onceCallback);
  }

  clear(): void {
    this.listeners.clear();
  }
}

// 싱글톤 인스턴스
export const eventBus = new EventBusImpl();

// 이벤트 타입 정의
export const EVENTS = {
  // 주석 관련 이벤트
  ANNOTATION_CREATED: 'annotation:created',
  ANNOTATION_UPDATED: 'annotation:updated',
  ANNOTATION_DELETED: 'annotation:deleted',
  ANNOTATION_SELECTED: 'annotation:selected',
  ANNOTATION_DESELECTED: 'annotation:deselected',
  
  // 뷰 관련 이벤트
  VIEW_ZOOM_CHANGED: 'view:zoom:changed',
  VIEW_PAN_CHANGED: 'view:pan:changed',
  VIEW_RESET: 'view:reset',
  
  // 문서 관련 이벤트
  DOCUMENT_LOADED: 'document:loaded',
  DOCUMENT_SAVED: 'document:saved',
  DOCUMENT_CLOSED: 'document:closed',
  
  // 내보내기 관련 이벤트
  EXPORT_STARTED: 'export:started',
  EXPORT_PROGRESS: 'export:progress',
  EXPORT_COMPLETED: 'export:completed',
  EXPORT_FAILED: 'export:failed',
  
  // AI 관련 이벤트
  AI_ANALYSIS_STARTED: 'ai:analysis:started',
  AI_ANALYSIS_COMPLETED: 'ai:analysis:completed',
  AI_SUGGESTION_GENERATED: 'ai:suggestion:generated',
  
  // OCR 관련 이벤트
  OCR_STARTED: 'ocr:started',
  OCR_PROGRESS: 'ocr:progress',
  OCR_COMPLETED: 'ocr:completed',
  OCR_FAILED: 'ocr:failed',
} as const;

export type EventType = typeof EVENTS[keyof typeof EVENTS];

