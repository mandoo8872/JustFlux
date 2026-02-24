import { useState, useCallback, useRef } from 'react';

interface SelectionState {
  selectedAnnotationIds: string[];
  hoveredAnnotationId: string | null;
  isMultiSelect: boolean;
}

const initialSelectionState: SelectionState = {
  selectedAnnotationIds: [],
  hoveredAnnotationId: null,
  isMultiSelect: false
};

export const useAnnotationSelection = () => {
  const [selectionState, setSelectionState] = useState<SelectionState>(initialSelectionState);
  const clickStateRef = useRef({ clickCount: 0, clickTimer: null as ReturnType<typeof setTimeout> | null });

  const selectAnnotation = useCallback((annotationId: string, multiSelect = false) => {
    
    setSelectionState(prev => {
      if (multiSelect) {
        // 다중 선택: 이미 선택된 경우 제거, 아니면 추가
        const isSelected = prev.selectedAnnotationIds.includes(annotationId);
        return {
          ...prev,
          selectedAnnotationIds: isSelected 
            ? prev.selectedAnnotationIds.filter(id => id !== annotationId)
            : [...prev.selectedAnnotationIds, annotationId]
        };
      } else {
        // 단일 선택: 기존 선택 해제 후 새로 선택
        return {
          ...prev,
          selectedAnnotationIds: [annotationId]
        };
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectionState(prev => ({
      ...prev,
      selectedAnnotationIds: []
    }));
  }, []);

  const setHoveredAnnotation = useCallback((annotationId: string | null) => {
    setSelectionState(prev => ({
      ...prev,
      hoveredAnnotationId: annotationId
    }));
  }, []);

  const isAnnotationSelected = useCallback((annotationId: string) => {
    return selectionState.selectedAnnotationIds.includes(annotationId);
  }, [selectionState.selectedAnnotationIds]);

  const isAnnotationHovered = useCallback((annotationId: string) => {
    return selectionState.hoveredAnnotationId === annotationId;
  }, [selectionState.hoveredAnnotationId]);

  const handleAnnotationClick = useCallback((annotationId: string, e: React.MouseEvent) => {
    const isCtrlPressed = e.ctrlKey || e.metaKey;
    const isShiftPressed = e.shiftKey;
    
    // 더블클릭 감지
    const newClickCount = clickStateRef.current.clickCount + 1;
    if (clickStateRef.current.clickTimer) {
      clearTimeout(clickStateRef.current.clickTimer);
    }
    
    if (newClickCount === 2) {
      // 더블클릭: 인라인 편집 시작
      // 인라인 편집 로직은 상위 컴포넌트에서 처리
      clickStateRef.current = { clickCount: 0, clickTimer: null };
      return { action: 'inline-edit', annotationId };
    } else {
      // 단일 클릭: 선택 처리
      if (isCtrlPressed || isShiftPressed) {
        selectAnnotation(annotationId, true);
      } else {
        selectAnnotation(annotationId, false);
      }
      
      const timer = setTimeout(() => {
        clickStateRef.current = { clickCount: 0, clickTimer: null };
      }, 300);
      clickStateRef.current = { clickCount: newClickCount, clickTimer: timer };
      
      return { action: 'select', annotationId };
    }
  }, [selectAnnotation]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // 캔버스 직접 클릭 시 선택 해제
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  }, [clearSelection]);

  return {
    selectionState,
    selectAnnotation,
    clearSelection,
    setHoveredAnnotation,
    isAnnotationSelected,
    isAnnotationHovered,
    handleAnnotationClick,
    handleCanvasClick
  };
};
