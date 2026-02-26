/**
 * AnnotationInteraction - 주석 상호작용 처리
 * 이벤트 기반 아키텍처로 확장성 극대화
 */

import { useCallback, useRef, useState } from 'react';
import type { Annotation, ToolType, BBox } from '../../../core/model/types';

interface InteractionState {
  isDrawing: boolean;
  isPanning: boolean;
  isDragging: boolean;
  drawStart: { x: number; y: number } | null;
  drawCurrent: { x: number; y: number } | null;
  panStart: { x: number; y: number } | null;
  dragStart: { x: number; y: number } | null;
  hoveredAnnotationId: string | null;
}

interface AnnotationInteractionProps {
  activeTool: ToolType;
  scale: number;
  onAnnotationCreate: (annotation: Annotation) => void;
  onAnnotationSelect: (id: string | null, multi?: boolean) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
}

/**
 * 주석 상호작용 훅
 * 모든 상호작용 로직을 중앙화하여 관리
 */
export function useAnnotationInteraction({
  activeTool,
  scale,
  onAnnotationCreate,
  onAnnotationSelect,
  onPan
}: AnnotationInteractionProps) {
  const [state, setState] = useState<InteractionState>({
    isDrawing: false,
    isPanning: false,
    isDragging: false,
    drawStart: null,
    drawCurrent: null,
    panStart: null,
    dragStart: null,
    hoveredAnnotationId: null
  });

  const canvasRef = useRef<HTMLDivElement>(null);

  // 포인터 이벤트 처리
  const handlePointerDown = useCallback((_event: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (_event.clientX - rect.left) / scale;
    const y = (_event.clientY - rect.top) / scale;

    switch (activeTool) {
      case 'select':
        handleSelectTool(_event, x, y);
        break;
      case 'pan':
        handlePanTool(_event, x, y);
        break;
      case 'text':
      case 'highlight':
      case 'rectangle':
      case 'ellipse':
      case 'arrow':
      case 'star':
      case 'heart':
      case 'lightning':
        handleDrawingTool(_event, x, y);
        break;
      case 'brush':
      case 'eraser':
        handleBrushTool(_event, x, y);
        break;
    }
  }, [activeTool, scale, state]);

  const handlePointerMove = useCallback((_event: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (_event.clientX - rect.left) / scale;
    const y = (_event.clientY - rect.top) / scale;

    if (state.isDrawing) {
      setState(prev => ({ ...prev, drawCurrent: { x, y } }));
    } else if (state.isPanning) {
      handlePanMove(_event, x, y);
    } else if (state.isDragging) {
      handleDragMove(_event, x, y);
    }
  }, [state, scale]);

  const handlePointerUp = useCallback((_event: React.PointerEvent) => {
    if (state.isDrawing) {
      finishDrawing();
    } else if (state.isPanning) {
      finishPanning();
    } else if (state.isDragging) {
      finishDragging();
    }
  }, [state]);

  // 키보드 이벤트 처리
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Delete':
      case 'Backspace':
        // 선택된 주석 삭제
        break;
      case 'Escape':
        // 선택 해제
        onAnnotationSelect(null);
        break;
      case 'a':
        if (event.ctrlKey || event.metaKey) {
          // 전체 선택
          event.preventDefault();
        }
        break;
      case 'c':
        if (event.ctrlKey || event.metaKey) {
          // 복사
          event.preventDefault();
        }
        break;
      case 'v':
        if (event.ctrlKey || event.metaKey) {
          // 붙여넣기
          event.preventDefault();
        }
        break;
    }
  }, []);

  // 선택 도구 처리
  const handleSelectTool = useCallback((_event: React.PointerEvent, _x: number, _y: number) => {
    // 주석 선택 로직
    const annotationId = findAnnotationAtPoint(_x, _y);
    if (annotationId) {
      onAnnotationSelect(annotationId, _event.ctrlKey || _event.metaKey);
    } else {
      onAnnotationSelect(null);
    }
  }, []);

  // 팬 도구 처리
  const handlePanTool = useCallback((_event: React.PointerEvent, x: number, y: number) => {
    setState(prev => ({
      ...prev,
      isPanning: true,
      panStart: { x, y }
    }));
  }, []);

  // 그리기 도구 처리
  const handleDrawingTool = useCallback((_event: React.PointerEvent, x: number, y: number) => {
    setState(prev => ({
      ...prev,
      isDrawing: true,
      drawStart: { x, y },
      drawCurrent: { x, y }
    }));
  }, []);

  // 브러시 도구 처리
  const handleBrushTool = useCallback((_event: React.PointerEvent, _x: number, _y: number) => {
    // 브러시 그리기 로직
  }, []);

  // 팬 이동 처리
  const handlePanMove = useCallback((_event: React.PointerEvent, x: number, y: number) => {
    if (state.panStart && onPan) {
      const deltaX = x - state.panStart.x;
      const deltaY = y - state.panStart.y;
      onPan(deltaX, deltaY);
    }
  }, [state.panStart, onPan]);

  // 드래그 이동 처리
  const handleDragMove = useCallback((_event: React.PointerEvent, _x: number, _y: number) => {
    if (state.dragStart) {
      // 선택된 주석 이동
    }
  }, [state.dragStart]);

  // 그리기 완료
  const finishDrawing = useCallback(() => {
    if (state.drawStart && state.drawCurrent) {
      const bbox = calculateBBox(state.drawStart, state.drawCurrent);
      const annotation = createAnnotation(activeTool, bbox);
      if (annotation) {
        onAnnotationCreate(annotation);
      }
    }

    setState(prev => ({
      ...prev,
      isDrawing: false,
      drawStart: null,
      drawCurrent: null
    }));
  }, [state.drawStart, state.drawCurrent, activeTool, onAnnotationCreate]);

  // 팬 완료
  const finishPanning = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPanning: false,
      panStart: null
    }));
  }, []);

  // 드래그 완료
  const finishDragging = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDragging: false,
      dragStart: null
    }));
  }, []);

  // 주석 생성 (단순화)
  const createAnnotation = useCallback((_tool: ToolType, bbox: BBox): Annotation | null => {
    // 기본 주석 생성 (타입 안전성을 위해 단순화)
    return {
      id: `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'text' as const,
      bbox,
      content: '텍스트',
      pageId: 'current',
      style: {
        fontSize: 16,
        fontFamily: 'sans-serif',
        stroke: '#000000',
        strokeWidth: 1,
        fill: 'transparent'
      },
      createdAt: Date.now(),
      modifiedAt: Date.now()
    };
  }, []);

  // BBox 계산
  const calculateBBox = useCallback((start: { x: number; y: number }, current: { x: number; y: number }): BBox => {
    const x = Math.min(start.x, current.x);
    const y = Math.min(start.y, current.y);
    const width = Math.abs(current.x - start.x);
    const height = Math.abs(current.y - start.y);

    return { x, y, width, height };
  }, []);

  // 포인트에서 주석 찾기
  const findAnnotationAtPoint = useCallback((_x: number, _y: number): string | null => {
    // 실제 구현에서는 주석 목록을 받아서 처리
    return null;
  }, []);

  return {
    canvasRef,
    state,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleKeyDown
  };
}
