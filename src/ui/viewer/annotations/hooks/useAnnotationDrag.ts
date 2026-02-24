import { useState, useCallback, useRef, useEffect } from 'react';

interface DragState {
  isDragging: boolean;
  draggedAnnotationId: string | null;
  offset: { x: number; y: number };
  currentPosition: { x: number; y: number };
  startPosition: { x: number; y: number };
}

const initialDragState: DragState = {
  isDragging: false,
  draggedAnnotationId: null,
  offset: { x: 0, y: 0 },
  currentPosition: { x: 0, y: 0 },
  startPosition: { x: 0, y: 0 }
};

export const useAnnotationDrag = () => {
  const [dragState, setDragState] = useState<DragState>(initialDragState);
  const rafIdRef = useRef<number | null>(null);
  const rafActiveRef = useRef(false);
  const lastMoveRef = useRef<{ x: number; y: number } | null>(null);

  const startDrag = useCallback((annotationId: string, offset: { x: number; y: number }, startPosition: { x: number; y: number }) => {
    setDragState({
      isDragging: true,
      draggedAnnotationId: annotationId,
      offset,
      currentPosition: startPosition,
      startPosition
    });
    
    // rAF 드래그 루프 시작
    rafActiveRef.current = true;
    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(runRafTick);
    }
  }, []);

  const updateDragPosition = useCallback((position: { x: number; y: number }) => {
    setDragState(prev => ({
      ...prev,
      currentPosition: position
    }));
  }, []);

  const endDrag = useCallback(() => {
    setDragState(initialDragState);
    
    // rAF 루프 정리
    rafActiveRef.current = false;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    lastMoveRef.current = null;
  }, []);

  const isDraggingAnnotation = useCallback((annotationId: string) => {
    return dragState.isDragging && dragState.draggedAnnotationId === annotationId;
  }, [dragState.isDragging, dragState.draggedAnnotationId]);

  const runRafTick = useCallback(() => {
    if (!rafActiveRef.current) {
      rafIdRef.current = null;
      return;
    }
    
    rafIdRef.current = null;
    const lastMove = lastMoveRef.current;
    
    if (!lastMove) {
      // 드래그 중이지만 마우스 이동이 없으면 다음 프레임 스케줄
      rafIdRef.current = requestAnimationFrame(runRafTick);
      return;
    }

    // 드래그 위치 업데이트 로직은 상위 컴포넌트에서 처리
    // 여기서는 rAF 루프만 관리
    
    // 다음 프레임 스케줄
    if (rafActiveRef.current) {
      rafIdRef.current = requestAnimationFrame(runRafTick);
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragState.isDragging) {
      lastMoveRef.current = { x: e.clientX, y: e.clientY };
      if (!rafActiveRef.current) {
        rafActiveRef.current = true;
        rafIdRef.current = requestAnimationFrame(runRafTick);
      }
    }
  }, [dragState.isDragging, runRafTick]);

  // 정리 함수
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return {
    dragState,
    startDrag,
    updateDragPosition,
    endDrag,
    isDraggingAnnotation,
    handlePointerMove
  };
};
