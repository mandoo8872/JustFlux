/**
 * Annotation Renderer - 기존 주석 컴포넌트들을 래핑하는 렌더러
 * 기존 코드와의 호환성을 유지하면서 새로운 시스템으로 마이그레이션
 */

import React from 'react';
import { annotationRegistry } from '../services/AnnotationRegistry';
// import type { AnnotationRenderer } from '../types/AnnotationTypes';
import type { Annotation } from '../../../core/model/types';

// 기존 주석 컴포넌트들을 임포트
import { TextAnnotationComponent } from '../../../ui/viewer/annotations/TextAnnotation';
import { HighlightAnnotationComponent } from '../../../ui/viewer/annotations/HighlightAnnotation';
import { ShapeAnnotationComponent } from '../../../ui/viewer/annotations/ShapeAnnotation';
import { ImageAnnotationComponent } from '../../../ui/viewer/annotations/ImageAnnotation';
import { ArrowAnnotationComponent } from '../../../ui/viewer/annotations/ArrowAnnotation';
import { LightningAnnotationComponent } from '../../../ui/viewer/annotations/LightningAnnotation';
import { StarAnnotationComponent } from '../../../ui/viewer/annotations/StarAnnotation';
import { HeartAnnotationComponent } from '../../../ui/viewer/annotations/HeartAnnotation';
import { FreehandAnnotationComponent } from '../../../ui/viewer/annotations/FreehandAnnotation';

/**
 * 기존 주석 컴포넌트들을 새로운 시스템에 등록
 */
export function registerLegacyAnnotations(): void {
  console.log('🔄 [AnnotationRenderer] Registering legacy annotation components...');

  // 텍스트 주석
  annotationRegistry.register('text', {
    render: (props) => <TextAnnotationComponent
      annotation={props.annotation}
      isSelected={props.isSelected}
      isHovered={props.isHovered}
      scale={props.scale}
      onSelect={props.onSelect}
      onUpdate={props.onUpdate}
      onDelete={props.onDelete}
      onHover={props.onHover || (() => { })}
      onHoverEnd={props.onHoverEnd || (() => { })}
      onDragStart={props.onDragStart}
      isDragging={props.isDragging}
    />,
    validate: (annotation) => annotation.type === 'text' && typeof annotation.text === 'string',
    getDefaultProps: () => ({
      type: 'text',
      text: '',
      style: {
        fontSize: 14,
        color: '#000000',
        backgroundColor: 'transparent'
      }
    })
  });

  // 하이라이트 주석
  annotationRegistry.register('highlight', {
    render: (props) => <HighlightAnnotationComponent
      annotation={props.annotation}
      isSelected={props.isSelected}
      scale={props.scale}
      onSelect={props.onSelect}
      onUpdate={props.onUpdate}
      onDelete={props.onDelete}
    />,
    validate: (annotation) => annotation.type === 'highlight' && !!annotation.bbox,
    getDefaultProps: () => ({
      type: 'highlight',
      style: {
        color: '#ffff00',
        opacity: 0.5
      }
    })
  });

  // 도형 주석 (사각형, 원형)
  annotationRegistry.register('rectangle', {
    render: (props) => <ShapeAnnotationComponent
      annotation={props.annotation}
      isSelected={props.isSelected}
      scale={props.scale}
      onSelect={props.onSelect}
      onUpdate={props.onUpdate}
      onDelete={props.onDelete}
      onPointerDown={props.onPointerDown}
    />,
    validate: (annotation) => annotation.type === 'rectangle' && !!annotation.bbox,
    getDefaultProps: () => ({
      type: 'rectangle',
      style: {
        strokeColor: '#000000',
        strokeWidth: 2,
        fillColor: 'transparent'
      }
    })
  });

  annotationRegistry.register('ellipse', {
    render: (props) => <ShapeAnnotationComponent
      annotation={props.annotation}
      isSelected={props.isSelected}
      scale={props.scale}
      onSelect={props.onSelect}
      onUpdate={props.onUpdate}
      onDelete={props.onDelete}
      onPointerDown={props.onPointerDown}
    />,
    validate: (annotation) => annotation.type === 'ellipse' && !!annotation.bbox,
    getDefaultProps: () => ({
      type: 'ellipse',
      style: {
        strokeColor: '#000000',
        strokeWidth: 2,
        fillColor: 'transparent'
      }
    })
  });

  // 이미지 주석
  annotationRegistry.register('image', {
    render: (props) => <ImageAnnotationComponent
      annotation={props.annotation}
      isSelected={props.isSelected}
      isHovered={props.isHovered}
      scale={props.scale}
      onSelect={props.onSelect}
      onUpdate={props.onUpdate}
      onDelete={props.onDelete}
      onHover={props.onHover || (() => { })}
      onHoverEnd={props.onHoverEnd || (() => { })}
      onDragStart={props.onDragStart}
    />,
    validate: (annotation) => annotation.type === 'image' && !!annotation.imageData,
    getDefaultProps: () => ({
      type: 'image',
      imageData: '',
      style: {
        opacity: 1.0
      }
    })
  });

  // 화살표 주석
  annotationRegistry.register('arrow', {
    render: (props) => <ArrowAnnotationComponent
      annotation={props.annotation}
      isSelected={props.isSelected}
      scale={props.scale}
      onSelect={props.onSelect}
      onUpdate={props.onUpdate}
      onDelete={props.onDelete}
      onPointerDown={props.onPointerDown}
    />,
    validate: (annotation) => annotation.type === 'arrow' && !!annotation.bbox,
    getDefaultProps: () => ({
      type: 'arrow',
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 100, y: 100 },
      style: {
        strokeColor: '#000000',
        strokeWidth: 2
      }
    })
  });

  // 선 주석 (화살표 없는)
  annotationRegistry.register('line', {
    render: (props) => <ArrowAnnotationComponent
      annotation={props.annotation}
      isSelected={props.isSelected}
      scale={props.scale}
      onSelect={props.onSelect}
      onUpdate={props.onUpdate}
      onDelete={props.onDelete}
      onPointerDown={props.onPointerDown}
    />,
    validate: (annotation) => annotation.type === 'line' && !!annotation.startPoint && !!annotation.endPoint,
    getDefaultProps: () => ({
      type: 'line',
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 100, y: 100 },
      style: {
        strokeColor: '#000000',
        strokeWidth: 2
      }
    })
  });

  // 번개 주석
  annotationRegistry.register('lightning', {
    render: (props) => <LightningAnnotationComponent
      annotation={props.annotation}
      isSelected={props.isSelected}
      scale={props.scale}
      onSelect={props.onSelect}
      onUpdate={props.onUpdate}
      onDelete={props.onDelete}
    // onPointerDown={props.onPointerDown} // Temporarily removed to fix build error
    />,
    validate: (annotation) => annotation.type === 'lightning' && !!annotation.bbox,
    getDefaultProps: () => ({
      type: 'lightning',
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 100, y: 100 },
      style: {
        strokeColor: '#000000',
        strokeWidth: 2
      }
    })
  });

  // 별 주석
  annotationRegistry.register('star', {
    render: (props) => <StarAnnotationComponent
      annotation={props.annotation}
      isSelected={props.isSelected}
      scale={props.scale}
      onSelect={props.onSelect}
      onUpdate={props.onUpdate}
      onDelete={props.onDelete}
    // onPointerDown={props.onPointerDown} // Temporarily removed
    />,
    validate: (annotation) => annotation.type === 'star' && !!annotation.bbox,
    getDefaultProps: () => ({
      type: 'star',
      style: {
        strokeColor: '#000000',
        strokeWidth: 2,
        fillColor: '#ffff00'
      }
    })
  });

  // 하트 주석
  annotationRegistry.register('heart', {
    render: (props) => <HeartAnnotationComponent
      annotation={props.annotation}
      isSelected={props.isSelected}
      scale={props.scale}
      onSelect={props.onSelect}
      onUpdate={props.onUpdate}
      onDelete={props.onDelete}
    // onPointerDown={props.onPointerDown} // Temporarily removed
    />,
    validate: (annotation) => annotation.type === 'heart' && !!annotation.bbox,
    getDefaultProps: () => ({
      type: 'heart',
      style: {
        strokeColor: '#ff0000',
        strokeWidth: 2,
        fillColor: '#ff0000'
      }
    })
  });

  // 자유 그리기 주석
  annotationRegistry.register('freehand', {
    render: (props) => <FreehandAnnotationComponent
      annotation={props.annotation}
      isSelected={props.isSelected}
      isHovered={props.isHovered}
      scale={props.scale}
      onSelect={props.onSelect}
      onUpdate={props.onUpdate}
      onDelete={props.onDelete}
      onPointerDown={props.onPointerDown}
      onHover={props.onHover}
      onHoverEnd={props.onHoverEnd}
    />,
    validate: (annotation) => annotation.type === 'freehand' && !!annotation.bbox && Array.isArray((annotation as any).points),
    getDefaultProps: () => ({
      type: 'freehand',
      points: [],
      style: {
        stroke: '#000000',
        strokeWidth: 3
      }
    })
  });

  console.log('✅ [AnnotationRenderer] Legacy annotation components registered');
}

/**
 * 주석 렌더러 컴포넌트
 * 기존 AnnotationLayerV2의 렌더링 로직을 대체
 */
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
  annotation,
  isSelected,
  isHovered,
  isDragging,
  scale,
  onSelect,
  onUpdate,
  onDelete,
  onPointerDown,
  onHover,
  onHoverEnd
}: AnnotationRendererProps) {
  const renderer = annotationRegistry.getRenderer(annotation.type);

  if (!renderer) {
    console.warn(`⚠️ [AnnotationRenderer] No renderer found for type: ${annotation.type}`);
    return null;
  }

  const props = {
    annotation,
    isSelected,
    isHovered,
    isDragging,
    scale,
    onSelect,
    onUpdate,
    onDelete,
    onPointerDown,
    onHover,
    onHoverEnd
  };

  return renderer.render(props);
}
