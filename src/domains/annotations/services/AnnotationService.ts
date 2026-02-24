import { logger } from '../../../utils/logger';
/**
 * Annotation Service - 주석 비즈니스 로직
 * 주석 생성, 수정, 삭제, 검증 등의 핵심 로직
 */

import { annotationRegistry } from './AnnotationRegistry';
import type { Annotation } from '../../../core/model/types';

export class AnnotationService {
  /**
   * 주석 생성
   */
  createAnnotation(type: string, pageId: string, props: any, style?: any): Annotation | null {
    logger.debug(`📝 [AnnotationService] Creating annotation of type: ${type}`);

    const renderer = annotationRegistry.getRenderer(type);
    if (!renderer) {
      console.error(`❌ [AnnotationService] No renderer found for type: ${type}`);
      return null;
    }

    const defaultProps = renderer.getDefaultProps();
    const annotation = {
      ...defaultProps,
      id: `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pageId,
      ...props, // Spread passed props (bbox, startPoint, etc.) to overwrite defaults
      style: { ...defaultProps.style, ...style },
      createdAt: Date.now(),
      modifiedAt: Date.now()
    };

    if (!renderer.validate(annotation)) {
      console.error(`❌ [AnnotationService] Invalid annotation data for type: ${type}`);
      return null;
    }

    return annotation as Annotation;
  }

  /**
   * 주석 업데이트
   */
  updateAnnotation(annotation: Annotation, updates: Partial<Annotation>): Annotation | null {
    logger.debug(`📝 [AnnotationService] Updating annotation: ${annotation.id}`);

    const renderer = annotationRegistry.getRenderer(annotation.type);
    if (!renderer) {
      console.error(`❌ [AnnotationService] No renderer found for type: ${annotation.type}`);
      return null;
    }

    const updatedAnnotation = { ...annotation, ...updates };

    if (!renderer.validate(updatedAnnotation)) {
      console.error(`❌ [AnnotationService] Invalid updated annotation data`);
      return null;
    }

    return updatedAnnotation as any;
  }

  /**
   * 주석 검증
   */
  validateAnnotation(annotation: Annotation): boolean {
    const renderer = annotationRegistry.getRenderer(annotation.type);
    if (!renderer) {
      return false;
    }
    return renderer.validate(annotation);
  }

  /**
   * 주석 삭제 가능 여부 확인
   */
  canDeleteAnnotation(_annotation: Annotation): boolean {
    // 기본적으로 모든 주석은 삭제 가능
    // 향후 권한 시스템과 연동할 수 있음
    return true;
  }

  /**
   * 주석 복제
   */
  cloneAnnotation(annotation: Annotation): Annotation | null {
    logger.debug(`📝 [AnnotationService] Cloning annotation: ${annotation.id}`);

    const clonedAnnotation = {
      ...annotation,
      id: `annotation-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      // 위치를 약간 이동시켜 중복 방지
      bbox: {
        ...annotation.bbox,
        x: annotation.bbox.x + 10,
        y: annotation.bbox.y + 10,
      }
    };

    if (!this.validateAnnotation(clonedAnnotation)) {
      console.error(`❌ [AnnotationService] Invalid cloned annotation`);
      return null;
    }

    return clonedAnnotation;
  }
}

// 싱글톤 인스턴스
export const annotationService = new AnnotationService();
