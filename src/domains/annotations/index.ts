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
export { AnnotationManager } from './components/AnnotationManager';
export { AnnotationRendererComponent, registerLegacyAnnotations } from './components/AnnotationRenderer';

// 스토어
export { useAnnotationStore } from '../../state/stores/AnnotationStore';

// 이벤트 시스템
import { eventBus, EVENTS } from '../../core/events/EventBus';

// 초기화 함수
export function initializeAnnotations(): void {
  console.log('🚀 [Annotations] Initializing annotation system...');
  
  // 기존 주석 컴포넌트들 등록
  // registerLegacyAnnotations();
  
  // 주석 생성 이벤트
  eventBus.on(EVENTS.ANNOTATION_CREATED, (annotation: any) => {
    console.log('📝 [Annotations] Annotation created:', annotation.id);
  });
  
  // 주석 업데이트 이벤트
  eventBus.on(EVENTS.ANNOTATION_UPDATED, (annotation: any) => {
    console.log('📝 [Annotations] Annotation updated:', annotation.id);
  });
  
  // 주석 삭제 이벤트
  eventBus.on(EVENTS.ANNOTATION_DELETED, (annotationId: string) => {
    console.log('📝 [Annotations] Annotation deleted:', annotationId);
  });
  
  console.log('✅ [Annotations] Annotation system initialized');
}
