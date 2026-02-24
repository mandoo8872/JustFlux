/**
 * EventService - 이벤트 처리 전용 서비스
 * 이벤트 발생, 구독, 관리 등 이벤트 관련 작업만 담당
 */

import { eventBus } from '../events/EventBus';
import { EVENTS } from '../events/EventTypes';
import type { 
  AnnotationCreatedEvent,
  AnnotationUpdatedEvent,
  AnnotationDeletedEvent,
  AnnotationSelectedEvent,
  PageCreatedEvent,
  PageUpdatedEvent,
  PageDeletedEvent,
  PageSelectedEvent,
  DocumentLoadedEvent,
  ViewChangedEvent,
  ToolChangedEvent
} from '../events/EventTypes';

export class EventService {
  /**
   * 주석 이벤트 발생
   */
  static emitAnnotationCreated(annotation: any, pageId: string): void {
    const event: AnnotationCreatedEvent = {
      annotation,
      pageId,
      timestamp: Date.now()
    };
    eventBus.emit(EVENTS.ANNOTATION_CREATED, event);
  }
  
  static emitAnnotationUpdated(annotationId: string, updates: any, pageId: string): void {
    const event: AnnotationUpdatedEvent = {
      annotationId,
      updates,
      pageId,
      timestamp: Date.now()
    };
    eventBus.emit(EVENTS.ANNOTATION_UPDATED, event);
  }
  
  static emitAnnotationDeleted(annotationId: string, pageId: string): void {
    const event: AnnotationDeletedEvent = {
      annotationId,
      pageId,
      timestamp: Date.now()
    };
    eventBus.emit(EVENTS.ANNOTATION_DELETED, event);
  }
  
  static emitAnnotationSelected(annotationIds: string[], pageId: string): void {
    const event: AnnotationSelectedEvent = {
      annotationIds,
      pageId,
      timestamp: Date.now()
    };
    eventBus.emit(EVENTS.ANNOTATION_SELECTED, event);
  }
  
  /**
   * 페이지 이벤트 발생
   */
  static emitPageCreated(page: any, documentId: string): void {
    const event: PageCreatedEvent = {
      page,
      documentId,
      timestamp: Date.now()
    };
    eventBus.emit(EVENTS.PAGE_CREATED, event);
  }
  
  static emitPageUpdated(pageId: string, updates: any, documentId: string): void {
    const event: PageUpdatedEvent = {
      pageId,
      updates,
      documentId,
      timestamp: Date.now()
    };
    eventBus.emit(EVENTS.PAGE_UPDATED, event);
  }
  
  static emitPageDeleted(pageId: string, documentId: string): void {
    const event: PageDeletedEvent = {
      pageId,
      documentId,
      timestamp: Date.now()
    };
    eventBus.emit(EVENTS.PAGE_DELETED, event);
  }
  
  static emitPageSelected(pageId: string, documentId: string): void {
    const event: PageSelectedEvent = {
      pageId,
      documentId,
      timestamp: Date.now()
    };
    eventBus.emit(EVENTS.PAGE_SELECTED, event);
  }
  
  /**
   * 문서 이벤트 발생
   */
  static emitDocumentLoaded(document: any): void {
    const event: DocumentLoadedEvent = {
      document,
      timestamp: Date.now()
    };
    eventBus.emit(EVENTS.DOCUMENT_LOADED, event);
  }
  
  /**
   * 뷰 이벤트 발생
   */
  static emitViewChanged(zoom: number, panX: number, panY: number): void {
    const event: ViewChangedEvent = {
      zoom,
      panX,
      panY,
      timestamp: Date.now()
    };
    eventBus.emit(EVENTS.VIEW_CHANGED, event);
  }
  
  /**
   * 도구 이벤트 발생
   */
  static emitToolChanged(tool: string, previousTool: string): void {
    const event: ToolChangedEvent = {
      tool,
      previousTool,
      timestamp: Date.now()
    };
    eventBus.emit(EVENTS.TOOL_CHANGED, event);
  }
  
  /**
   * 이벤트 구독
   */
  static subscribe<T>(event: string, callback: (data: T) => void): () => void {
    eventBus.on(event, callback);
    return () => eventBus.off(event, callback);
  }
  
  /**
   * 이벤트 구독 해제
   */
  static unsubscribe<T>(event: string, callback: (data: T) => void): void {
    eventBus.off(event, callback);
  }
  
  /**
   * 일회성 이벤트 구독
   */
  static subscribeOnce<T>(event: string, callback: (data: T) => void): void {
    eventBus.once(event, callback);
  }
}

