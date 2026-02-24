/**
 * AnnotationRenderer - 타입 기반 라우터
 * Component Map 방식으로 구현, 조건 분기나 스타일 로직 없음
 * 새로운 Annotation 타입 추가 시 componentMap에만 추가하면 됨
 */

import React from 'react';
import type { AnnotationRenderProps } from '../types/annotation';

// View 컴포넌트들 import
import { TextAnnotationView } from './views/TextAnnotationView';
import { HighlightAnnotationView } from './views/HighlightAnnotationView';
import { ShapeAnnotationView } from './views/ShapeAnnotationView';
import { ImageAnnotationView } from './views/ImageAnnotationView';
import { StampAnnotationView } from './views/StampAnnotationView';
import { FreehandAnnotationView } from './views/FreehandAnnotationView';

// ============================================
// Component Map 정의
// ============================================

const annotationViewMap = {
  text: TextAnnotationView,
  highlight: HighlightAnnotationView,
  ellipse: ShapeAnnotationView,
  rectangle: ShapeAnnotationView,
  arrow: ShapeAnnotationView,
  star: ShapeAnnotationView,
  heart: ShapeAnnotationView,
  lightning: ShapeAnnotationView,
  freehand: FreehandAnnotationView,
  image: ImageAnnotationView,
  stamp: StampAnnotationView,
  // 미래 확장을 위한 placeholder
  ocr: TextAnnotationView, // OCR은 텍스트와 유사하므로 TextAnnotationView 재사용
  ai: TextAnnotationView,  // AI도 텍스트와 유사하므로 TextAnnotationView 재사용
} as const;

// 타입 안전성을 위한 타입 정의 (사용하지 않으므로 제거)

// ============================================
// AnnotationRenderer 컴포넌트
// ============================================

export function AnnotationRenderer(props: AnnotationRenderProps): React.ReactElement {
  const { annotation } = props;

  // Component Map에서 해당 타입의 View 컴포넌트 가져오기
  const ViewComponent = annotationViewMap[annotation.type as keyof typeof annotationViewMap] as React.ComponentType<any>;

  // 타입 안전성을 위한 검증
  if (!ViewComponent) {
    console.warn(`Unknown annotation type: ${annotation.type}`);
    return <div>Unknown annotation type</div>;
  }

  // 타입 안전한 props 전달 (any로 우회하여 타입 호환성 문제 해결)
  return <ViewComponent {...(props as any)} />;
}

// ============================================
// 새로운 Annotation 타입 등록 헬퍼
// ============================================

/**
 * 새로운 Annotation 타입을 등록하는 함수
 * 플러그인 방식으로 확장 가능
 */
export function registerAnnotationView(
  type: string,
  component: React.ComponentType<AnnotationRenderProps>
): void {
  (annotationViewMap as any)[type] = component;
}

/**
 * 등록된 Annotation 타입 목록 조회
 */
export function getRegisteredAnnotationTypes(): string[] {
  return Object.keys(annotationViewMap);
}

/**
 * 특정 타입의 View 컴포넌트 조회
 */
export function getAnnotationView(type: string): React.ComponentType<any> | undefined {
  return annotationViewMap[type as keyof typeof annotationViewMap];
}
