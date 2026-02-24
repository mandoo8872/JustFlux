/**
 * AnnotationManager - 확장 가능한 주석 관리 시스템
 * 구조적 분해를 통한 확장성 극대화
 */

import { useCallback } from 'react';
import type { Annotation, ToolType } from '../../../core/model/types';
import { renderAnnotation } from './AnnotationRenderer';
import { useAnnotationInteraction } from './AnnotationInteraction';
import { useEventBus } from '../../../core/events/useEventBus';
import { EVENTS } from '../../../core/events/EventTypes';

interface AnnotationManagerProps {
  annotations: Annotation[];
  pageId: string;
  scale: number;
  activeTool: ToolType;
  selectedAnnotationIds: string[];
  onSelect: (annotationId: string | null, multi?: boolean) => void;
  onUpdate: (annotationId: string, updates: Partial<Annotation>) => void;
  onDelete: (annotationId: string) => void;
  onCreate: (annotation: Annotation) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
  setActiveTool?: (_tool: ToolType) => void;
}

export function AnnotationManager({
  annotations,
  pageId,
  scale,
  activeTool,
  selectedAnnotationIds,
  onSelect,
  onUpdate,
  onDelete,
  onCreate,
  onPan,
  setActiveTool: _setActiveTool
}: AnnotationManagerProps) {

  // 이벤트 시스템 사용
  const { emit } = useEventBus();

  // 상호작용 훅 사용
  const {
    canvasRef,
    state,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleKeyDown
  } = useAnnotationInteraction({
    activeTool,
    scale,
    onAnnotationCreate: (annotation) => {
      onCreate(annotation);
      // 이벤트 발생
      emit(EVENTS.ANNOTATION_CREATED, {
        annotation,
        pageId,
        timestamp: Date.now()
      });
    },
    onAnnotationSelect: (id, multi) => {
      onSelect(id, multi);
      // 이벤트 발생
      emit(EVENTS.ANNOTATION_SELECTED, {
        annotationIds: id ? [id] : [],
        pageId,
        timestamp: Date.now()
      });
    },
    onPan
  });

  // 주석 렌더링
  const renderAnnotations = useCallback(() => {
    return annotations.map(annotation => {
      const isSelected = selectedAnnotationIds.includes(annotation.id);
      const isHovered = state.hoveredAnnotationId === annotation.id;

      return (
        <div key={annotation.id}>
          {renderAnnotation({
            annotation,
            isSelected,
            isHovered,
            scale,
            onSelect: (id) => onSelect(id),
            onUpdate: (id, updates) => onUpdate(id, updates as Partial<Annotation>),
            onDelete: (id) => onDelete(id),
            onHover: () => {
              // 호버 상태 업데이트
            },
            onHoverEnd: () => {
              // 호버 상태 해제
            }
          })}
        </div>
      );
    });
  }, [annotations, selectedAnnotationIds, state.hoveredAnnotationId, scale, onSelect, onUpdate, onDelete]);

  // 그리기 중인 주석 렌더링
  const renderDrawingAnnotation = useCallback(() => {
    if (!state.isDrawing || !state.drawStart || !state.drawCurrent) {
      return null;
    }

    const bbox = {
      x: Math.min(state.drawStart.x, state.drawCurrent.x),
      y: Math.min(state.drawStart.y, state.drawCurrent.y),
      width: Math.abs(state.drawCurrent.x - state.drawStart.x),
      height: Math.abs(state.drawCurrent.y - state.drawStart.y)
    };

    // 임시 주석 생성 (단순화)
    const tempAnnotation: Annotation = {
      id: 'temp',
      type: 'text' as const,
      bbox,
      content: '임시',
      pageId: 'current',
      style: {
        fontSize: 16,
        fontFamily: 'sans-serif',
        stroke: '#000000',
        strokeWidth: 2,
        fill: 'transparent'
      },
      createdAt: Date.now(),
      modifiedAt: Date.now()
    };

    return (
      <div style={{ position: 'absolute', pointerEvents: 'none' }}>
        {renderAnnotation({
          annotation: tempAnnotation,
          isSelected: false,
          isHovered: false,
          scale,
          onSelect: () => { },
          onUpdate: () => { },
          onDelete: () => { },
          onHover: () => { },
          onHoverEnd: () => { }
        })}
      </div>
    );
  }, [state.isDrawing, state.drawStart, state.drawCurrent, activeTool, scale]);

  return (
    <div
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        cursor: getCursorForTool(activeTool)
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* 기존 주석들 */}
      {renderAnnotations()}

      {/* 그리기 중인 주석 */}
      {renderDrawingAnnotation()}
    </div>
  );
}

// 도구별 커서 반환
function getCursorForTool(tool: ToolType): string {
  switch (tool) {
    case 'select':
      return 'default';
    case 'pan':
      return 'grab';
    case 'text':
      return 'text';
    case 'highlight':
      return 'crosshair';
    case 'rectangle':
    case 'ellipse':
    case 'arrow':
    case 'star':
    case 'heart':
    case 'lightning':
      return 'crosshair';
    case 'brush':
      return 'crosshair';
    case 'eraser':
      return 'crosshair';
    default:
      return 'default';
  }
}
