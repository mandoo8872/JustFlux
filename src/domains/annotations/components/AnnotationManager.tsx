/**
 * Annotation Manager - 주석 관리 컴포넌트
 * 기존 AnnotationLayerV2의 기능을 모듈화하여 분리
 */

import React, { useCallback, useRef } from 'react';
import { useAnnotationStore } from '../../../state/stores/AnnotationStore';
import { annotationRegistry } from '../services/AnnotationRegistry';
import { annotationService } from '../services/AnnotationService';
import type { Annotation } from '../../../core/model/types';
import type { ToolType } from '../../../core/model/types';

interface AnnotationManagerProps {
  pageId: string;
  scale: number;
  activeTool: ToolType;
  onCreate: (annotation: Omit<Annotation, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Annotation>) => void;
  onDelete: (id: string) => void;
  // setActiveTool: (tool: ToolType) => void;
}

export function AnnotationManager({
  pageId,
  scale,
  activeTool,
  onCreate,
  onUpdate,
  onDelete,
  // setActiveTool
}: AnnotationManagerProps) {
  const { annotations, selectedAnnotationIds } = useAnnotationStore();
  const layerRef = useRef<HTMLDivElement>(null);

  // 현재 페이지의 주석들만 필터링
  const pageAnnotations = annotations.filter(annotation => annotation.pageId === pageId);

  // 주석 렌더링
  const renderAnnotation = useCallback((annotation: Annotation) => {
    const renderer = annotationRegistry.getRenderer(annotation.type);
    if (!renderer) {
      console.warn(`⚠️ [AnnotationManager] No renderer found for type: ${annotation.type}`);
      return null;
    }

    const props = {
      annotation,
      isSelected: selectedAnnotationIds.includes(annotation.id),
      isHovered: false, // TODO: 호버 상태 관리
      isDragging: false, // TODO: 드래그 상태 관리
      scale,
      onSelect: () => {
        // 선택 상태는 AnnotationStore에서 관리
        console.log('🎯 [AnnotationManager] Selecting annotation:', annotation.id);
      },
      onUpdate: (updates: Partial<Annotation>) => onUpdate(annotation.id, updates),
      onDelete: () => onDelete(annotation.id),
      onPointerDown: (e: React.PointerEvent) => {
        e.stopPropagation();
        console.log('🎯 [AnnotationManager] Pointer down on annotation:', annotation.id);
      },
      onHover: () => {
        // TODO: 호버 상태 설정
      },
      onHoverEnd: () => {
        // TODO: 호버 상태 해제
      }
    };

    return renderer.render(props);
  }, [scale, selectedAnnotationIds, onUpdate, onDelete]);

  // 캔버스 클릭 처리
  const onCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    console.log('🖱️ [AnnotationManager] Canvas pointer down with tool:', activeTool);
    
    if (activeTool === 'select') {
      if (e.target === layerRef.current) {
        // 선택 해제
        console.log('🎯 [AnnotationManager] Clearing selection');
      }
      return;
    }

    // 그리기 도구들
    if (['text', 'highlight', 'rect', 'ellipse', 'arrow', 'line', 'star', 'heart', 'lightning', 'brush', 'eraser'].includes(activeTool)) {
      e.preventDefault();
      const rect = layerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      console.log('🎨 [AnnotationManager] Starting draw at:', { x, y });
      
      // 주석 생성
      const newAnnotation = annotationService.createAnnotation(activeTool, pageId, { x, y, width: 0, height: 0 });
      if (newAnnotation) {
        onCreate(newAnnotation);
      }
    }
  }, [activeTool, scale, pageId, onCreate]);

  // 키보드 이벤트 처리
  const onCanvasKeyDown = useCallback((e: React.KeyboardEvent) => {
    console.log('⌨️ [AnnotationManager] Key down:', e.key, 'ctrlKey:', e.ctrlKey, 'metaKey:', e.metaKey);
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault();
      console.log('📋 [AnnotationManager] Paste triggered');
      // TODO: 붙여넣기 기능 구현
    }
  }, []);

  return (
    <div
      ref={layerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'auto',
        backgroundColor: 'transparent',
        touchAction: 'none'
      }}
      onPointerDown={onCanvasPointerDown}
      onKeyDown={onCanvasKeyDown}
      tabIndex={0}
    >
      {/* 주석들 렌더링 */}
      {pageAnnotations.map((annotation) => (
        <div key={annotation.id}>
          {renderAnnotation(annotation)}
        </div>
      ))}
    </div>
  );
}
