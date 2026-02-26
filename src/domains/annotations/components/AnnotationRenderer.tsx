/**
 * Annotation Renderer - 기존 주석 컴포넌트들을 래핑하는 렌더러
 * 데이터 기반 레지스트리 등록으로 반복 코드 제거
 */

import React from 'react';
import { annotationRegistry } from '../services/AnnotationRegistry';
import type { Annotation } from '../../../core/model/types';

// 기존 주석 컴포넌트들을 임포트
import { TextAnnotationComponent } from '../../../ui/viewer/annotations/TextAnnotation';
import { HighlightAnnotationComponent } from '../../../ui/viewer/annotations/HighlightAnnotation';
import { ShapeAnnotationComponent } from '../../../ui/viewer/annotations/ShapeAnnotation';
import { ImageAnnotationComponent } from '../../../ui/viewer/annotations/ImageAnnotation';
import { ArrowAnnotationComponent } from '../../../ui/viewer/annotations/ArrowAnnotation';

import { StarAnnotationComponent } from '../../../ui/viewer/annotations/StarAnnotation';
import { FreehandAnnotationComponent } from '../../../ui/viewer/annotations/FreehandAnnotation';
import { HighlighterAnnotationComponent } from '../../../ui/viewer/annotations/HighlighterAnnotation';

// ── 공통 Props 빌더 ──

/** 모든 주석에 공통인 core props */
const coreProps = (p: any) => ({
  annotation: p.annotation,
  isSelected: p.isSelected,
  scale: p.scale,
  onSelect: p.onSelect,
  onUpdate: p.onUpdate,
  onDelete: p.onDelete,
});

/** core + onPointerDown */
const withPointerDown = (p: any) => ({
  ...coreProps(p),
  onPointerDown: p.onPointerDown,
});

/** core + hover/drag (text, image, freehand 용) */
const withHoverDrag = (p: any) => ({
  ...coreProps(p),
  isHovered: p.isHovered,
  onHover: p.onHover || (() => { }),
  onHoverEnd: p.onHoverEnd || (() => { }),
  onPointerDown: p.onPointerDown,
  onDragStart: p.onDragStart,
  isDragging: p.isDragging,
});

// ── 주석 타입 설정 ──

interface AnnotationConfig {
  type: string;
  Component: React.ComponentType<any>;
  propsMapper: (p: any) => Record<string, any>;
  validate: (a: Annotation) => boolean;
  defaultProps: () => Record<string, any>;
}

const ANNOTATION_CONFIGS: AnnotationConfig[] = [
  // ── Text ──
  {
    type: 'text',
    Component: TextAnnotationComponent,
    propsMapper: withHoverDrag,
    validate: (a) => a.type === 'text' && 'content' in a && typeof a.content === 'string',
    defaultProps: () => ({ type: 'text', content: '', style: { fontSize: 14, color: '#000000', backgroundColor: '#FFFFFF' } }),
  },
  // ── Highlight ──
  {
    type: 'highlight',
    Component: HighlightAnnotationComponent,
    propsMapper: coreProps,
    validate: (a) => a.type === 'highlight' && !!a.bbox,
    defaultProps: () => ({ type: 'highlight', style: { color: '#ffff00', opacity: 0.5 } }),
  },
  // ── Shapes (rectangle, roundedRect, ellipse) ──
  {
    type: 'rectangle',
    Component: ShapeAnnotationComponent,
    propsMapper: withPointerDown,
    validate: (a) => a.type === 'rectangle' && !!a.bbox,
    defaultProps: () => ({ type: 'rectangle', style: { strokeColor: '#000000', strokeWidth: 1, fillColor: 'transparent' } }),
  },
  {
    type: 'roundedRect',
    Component: ShapeAnnotationComponent,
    propsMapper: withPointerDown,
    validate: (a) => a.type === 'roundedRect' && !!a.bbox,
    defaultProps: () => ({ type: 'roundedRect', cornerRadius: 20, style: { strokeColor: '#000000', strokeWidth: 1, fillColor: 'transparent' } }),
  },
  {
    type: 'ellipse',
    Component: ShapeAnnotationComponent,
    propsMapper: withPointerDown,
    validate: (a) => a.type === 'ellipse' && !!a.bbox,
    defaultProps: () => ({ type: 'ellipse', style: { strokeColor: '#000000', strokeWidth: 1, fillColor: 'transparent' } }),
  },
  // ── Image ──
  {
    type: 'image',
    Component: ImageAnnotationComponent,
    propsMapper: withHoverDrag,
    validate: (a) => a.type === 'image' && 'imageData' in a && !!a.imageData,
    defaultProps: () => ({ type: 'image', imageData: '', style: { opacity: 1.0 } }),
  },
  // ── Arrow & Line ──
  {
    type: 'arrow',
    Component: ArrowAnnotationComponent,
    propsMapper: withPointerDown,
    validate: (a) => a.type === 'arrow' && !!a.bbox,
    defaultProps: () => ({ type: 'arrow', startPoint: { x: 0, y: 0 }, endPoint: { x: 100, y: 100 }, style: { strokeColor: '#000000', strokeWidth: 1 } }),
  },
  {
    type: 'line',
    Component: ArrowAnnotationComponent,
    propsMapper: withPointerDown,
    validate: (a) => a.type === 'line' && 'startPoint' in a && 'endPoint' in a && !!a.startPoint && !!a.endPoint,
    defaultProps: () => ({ type: 'line', startPoint: { x: 0, y: 0 }, endPoint: { x: 100, y: 100 }, style: { strokeColor: '#000000', strokeWidth: 1 } }),
  },
  // ── Star ──
  {
    type: 'star',
    Component: StarAnnotationComponent,
    propsMapper: withHoverDrag,
    validate: (a) => a.type === 'star' && !!a.bbox,
    defaultProps: () => ({ type: 'star', numPoints: 5, innerRadius: 0.4, style: { stroke: '#000000', strokeWidth: 1, fill: '#FFD700' } }),
  },
  // ── Freehand ──
  {
    type: 'freehand',
    Component: FreehandAnnotationComponent,
    propsMapper: (p: any) => ({
      ...coreProps(p),
      isHovered: p.isHovered,
      onPointerDown: p.onPointerDown,
      onHover: p.onHover,
      onHoverEnd: p.onHoverEnd,
    }),
    validate: (a) => a.type === 'freehand' && !!a.bbox && 'points' in a && Array.isArray(a.points),
    defaultProps: () => ({ type: 'freehand', points: [], style: { stroke: '#000000', strokeWidth: 3 } }),
  },
  // ── Highlighter (freehand-style) ──
  {
    type: 'highlighter',
    Component: HighlighterAnnotationComponent,
    propsMapper: (p: any) => ({
      ...coreProps(p),
      isHovered: p.isHovered,
      onPointerDown: p.onPointerDown,
      onHover: p.onHover,
      onHoverEnd: p.onHoverEnd,
    }),
    validate: (a) => a.type === 'highlighter' && !!a.bbox && 'points' in a && Array.isArray(a.points),
    defaultProps: () => ({ type: 'highlighter', points: [], style: { stroke: '#FF9800', strokeWidth: 20, opacity: 0.3 } }),
  },
];

// ── 등록 함수 ──

/**
 * 기존 주석 컴포넌트들을 새로운 시스템에 등록 (데이터 기반)
 */
export function registerLegacyAnnotations(): void {
  for (const config of ANNOTATION_CONFIGS) {
    const { type, Component, propsMapper, validate, defaultProps } = config;
    annotationRegistry.register(type, {
      render: (props) => <Component {...propsMapper(props)} />,
      validate,
      getDefaultProps: defaultProps,
    });
  }
}

// ── 렌더러 컴포넌트 ──

interface AnnotationRendererProps {
  annotation: Annotation;
  isSelected: boolean;
  isHovered: boolean;
  isDragging: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<Annotation>) => void;
  onDelete: () => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onHover?: () => void;
  onHoverEnd?: () => void;
}

export function AnnotationRendererComponent({
  annotation, isSelected, isHovered, isDragging, scale,
  onSelect, onUpdate, onDelete, onPointerDown, onHover, onHoverEnd,
}: AnnotationRendererProps) {
  const renderer = annotationRegistry.getRenderer(annotation.type);

  if (!renderer) {
    console.warn(`⚠️ [AnnotationRenderer] No renderer found for type: ${annotation.type}`);
    return null;
  }

  return renderer.render({
    annotation, isSelected, isHovered, isDragging, scale,
    onSelect, onUpdate, onDelete, onPointerDown, onHover, onHoverEnd,
  });
}
