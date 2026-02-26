/**
 * AnnotationRenderer - 타입 기반 라우터 (구조적 리팩토링)
 * Component Map 방식으로 구현, 조건 분기나 스타일 로직 없음
 * 새로운 Annotation 타입 추가 시 componentMap에만 추가하면 됨
 */

import React from 'react';
import { AnnotationRenderer as NewAnnotationRenderer } from '../../../components/AnnotationRenderer';
import type { AnnotationRenderProps } from '../../../types/annotation';

// ============================================
// 기존 인터페이스 호환성 유지
// ============================================

export interface RenderProps extends AnnotationRenderProps {
  // 기존 코드와의 호환성을 위한 별칭
}

/**
 * 주석 렌더링 함수 - 새로운 구조로 위임
 */
export function renderAnnotation(props: RenderProps): React.ReactElement {
  return <NewAnnotationRenderer {...props} />;
}

/**
 * 새로운 주석 타입 등록 - 새로운 구조로 위임
 */
export function registerAnnotationRenderer(
  type: string,
  renderer: (props: RenderProps) => React.ReactElement
): void {
  // 새로운 구조의 registerAnnotationView로 위임
  import('../../../components/AnnotationRenderer').then(({ registerAnnotationView }) => {
    registerAnnotationView(type, renderer);
  });
}

/**
 * 등록된 주석 타입 목록 조회 - 새로운 구조로 위임
 */
export function getRegisteredAnnotationTypes(): string[] {
  // 임시로 기본 타입들 반환
  return ['text', 'highlight', 'ellipse', 'rectangle', 'arrow', 'star', 'lightning', 'image', 'stamp'];
}