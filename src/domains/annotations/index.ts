import { logger } from '../../utils/logger';
/**
 * Annotations Domain - 주석 시스템 진입점
 * 모든 주석 관련 기능을 통합하여 제공
 */

// 타입들
export * from './types/AnnotationTypes';

// 서비스들
export { annotationRegistry } from './services/AnnotationRegistry';
export { annotationService } from './services/AnnotationService';

// 컴포넌트들
import { registerLegacyAnnotations } from './components/AnnotationRenderer';
export { AnnotationManager } from './components/AnnotationManager';
export { AnnotationRendererComponent, registerLegacyAnnotations } from './components/AnnotationRenderer';

// 스토어
export { useAnnotationStore } from '../../state/stores/AnnotationStore';

// 이벤트 시스템
import { eventBus, EVENTS } from '../../core/events/EventBus';

// 초기화 함수
export function initializeAnnotations(): void {
  logger.debug('🚀 [Annotations] Initializing annotation system...');

  // 기존 주석 컴포넌트들 등록
  registerLegacyAnnotations();

  // 주석 생성 이벤트
  eventBus.on(EVENTS.ANNOTATION_CREATED, (annotation: any) => {
    logger.debug('📝 [Annotations] Annotation created:', annotation.id);
  });

  // 주석 업데이트 이벤트
  eventBus.on(EVENTS.ANNOTATION_UPDATED, (annotation: any) => {
    logger.debug('📝 [Annotations] Annotation updated:', annotation.id);
  });

  // 주석 삭제 이벤트
  eventBus.on(EVENTS.ANNOTATION_DELETED, (annotationId: string) => {
    logger.debug('📝 [Annotations] Annotation deleted:', annotationId);
  });

  logger.debug('✅ [Annotations] Annotation system initialized');
}
