import { logger } from '../../../utils/logger';
/**
 * Annotation Registry - 주석 타입 등록 시스템
 * 새로운 주석 타입을 쉽게 추가할 수 있는 레지스트리 패턴
 */

import type { AnnotationRegistry, AnnotationRenderer } from '../types/AnnotationTypes';

class AnnotationRegistryImpl implements AnnotationRegistry {
  private renderers = new Map<string, AnnotationRenderer>();

  register(type: string, renderer: AnnotationRenderer): void {
    logger.debug(`📝 [AnnotationRegistry] Registering annotation type: ${type}`);
    this.renderers.set(type, renderer);
  }

  getRenderer(type: string): AnnotationRenderer | null {
    const renderer = this.renderers.get(type);
    if (!renderer) {
      console.warn(`⚠️ [AnnotationRegistry] No renderer found for type: ${type}`);
    }
    return renderer || null;
  }

  getSupportedTypes(): string[] {
    return Array.from(this.renderers.keys());
  }

  validate(type: string, annotation: any): boolean {
    const renderer = this.getRenderer(type);
    if (!renderer) {
      return false;
    }
    return renderer.validate(annotation);
  }
}

// 싱글톤 인스턴스
export const annotationRegistry = new AnnotationRegistryImpl();

// 기본 주석 타입들 등록을 위한 헬퍼 함수
export function registerDefaultAnnotations(): void {
  logger.debug('🔧 [AnnotationRegistry] Registering default annotation types...');
  
  // 기본 주석 타입들은 기존 컴포넌트들을 래핑하여 등록
  // 이 부분은 기존 컴포넌트들을 마이그레이션할 때 구현
}
