/**
 * Annotation Store - 주석 관련 상태 관리
 * 기존 documentStore에서 주석 관련 부분을 분리
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Annotation, SelectionState } from '../../core/model/types';

interface AnnotationStore {
  // 선택 상태
  selection: SelectionState;
  selectedAnnotationIds: string[];

  // 주석 관련 상태
  annotations: Annotation[];
  hoveredAnnotationId: string | null;
  draggedAnnotationId: string | null;

  // 로딩 상태
  isAnnotationLoading: boolean;
  annotationError: string | null;

  // ============================================
  // Selection Actions
  // ============================================

  /** 주석 선택 */
  selectAnnotation: (id: string, multiSelect?: boolean) => void;

  /** 선택 해제 */
  clearSelection: () => void;

  /** 활성 도구 설정 */
  setActiveTool: (tool: string) => void;

  /** 호버된 주석 설정 */
  setHoveredAnnotation: (id: string | null) => void;

  /** 드래그 중인 주석 설정 */
  setDraggedAnnotation: (id: string | null) => void;

  // ============================================
  // Annotation Actions
  // ============================================

  /** 주석 추가 */
  addAnnotation: (annotation: Annotation) => void;

  /** 주석 업데이트 */
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;

  /** 주석 삭제 */
  deleteAnnotation: (id: string) => void;

  /** 주석 복제 */
  cloneAnnotation: (id: string) => void;

  /** 주석 이동 */
  moveAnnotation: (id: string, deltaX: number, deltaY: number) => void;

  /** 주석 크기 조절 */
  resizeAnnotation: (id: string, newWidth: number, newHeight: number) => void;

  /** 주석 스타일 변경 */
  updateAnnotationStyle: (id: string, style: Partial<Annotation['style']>) => void;

  // ============================================
  // Utility Actions
  // ============================================

  /** 선택된 주석들 가져오기 */
  getSelectedAnnotations: () => Annotation[];

  /** 주석 검색 */
  findAnnotation: (id: string) => Annotation | null;

  /** 주석 필터링 */
  filterAnnotations: (predicate: (annotation: Annotation) => boolean) => Annotation[];

  // ============================================
  // Document Integration
  // ============================================

  /** 현재 페이지의 주석들 가져오기 */
  getCurrentPageAnnotations: (pageId: string) => Annotation[];

  /** 주석을 현재 페이지에 추가 */
  addAnnotationToPage: (pageId: string, annotation: Annotation) => void;

  /** 주석을 현재 페이지에서 제거 */
  removeAnnotationFromPage: (pageId: string, annotationId: string) => void;

  /** 주석 제거 (간단한 버전) */
  removeAnnotation: (annotationId: string) => void;

  /** 주석들 선택 */
  selectAnnotations: (annotationIds: string[]) => void;
}

export const useAnnotationStore = create<AnnotationStore>()(
  immer((set, get) => ({
    // 초기 상태
    selection: {
      selectedPageId: null,
      selectedAnnotationIds: [],
      selectedRasterLayerId: null,
      activeTool: 'select',
      toolOptions: {}
    },
    selectedAnnotationIds: [],
    annotations: [],
    hoveredAnnotationId: null,
    draggedAnnotationId: null,
    isAnnotationLoading: false,
    annotationError: null,

    // ============================================
    // Selection Actions
    // ============================================

    selectAnnotation: (id: string, multiSelect = false) => {
      console.log(`🎯 [AnnotationStore] selectAnnotation called with id: ${id}, multiSelect: ${multiSelect}`);
      set((state) => {
        if (multiSelect) {
          const isSelected = state.selection.selectedAnnotationIds.includes(id);
          if (isSelected) {
            state.selection.selectedAnnotationIds = state.selection.selectedAnnotationIds.filter(
              (selectedId) => selectedId !== id
            );
          } else {
            state.selection.selectedAnnotationIds.push(id);
          }
        } else {
          state.selection.selectedAnnotationIds = [id];
        }
        // 최상위 레벨 selectedAnnotationIds도 동기화
        state.selectedAnnotationIds = [...state.selection.selectedAnnotationIds];
        console.log(`🎯 [AnnotationStore] selectedAnnotationIds now:`, state.selectedAnnotationIds);
      });
    },

    clearSelection: () => {
      set((state) => {
        state.selection.selectedAnnotationIds = [];
        state.selectedAnnotationIds = [];
        console.log('🎯 [AnnotationStore] Selection cleared');
      });
    },

    setActiveTool: (tool: string) => {
      set((state) => {
        state.selection.activeTool = tool as any;
      });
    },

    setHoveredAnnotation: (id: string | null) => {
      set((state) => {
        state.hoveredAnnotationId = id;
      });
    },

    setDraggedAnnotation: (id: string | null) => {
      set((state) => {
        state.draggedAnnotationId = id;
      });
    },

    // ============================================
    // Annotation Actions
    // ============================================

    addAnnotation: (annotation: Annotation) => {
      set((state) => {
        state.annotations.push(annotation);
      });
    },

    updateAnnotation: (id: string, updates: Partial<Annotation>) => {
      set((state) => {
        const index = state.annotations.findIndex((annotation) => annotation.id === id);
        if (index !== -1) {
          Object.assign(state.annotations[index], updates);
        }
      });
    },

    deleteAnnotation: (id: string) => {
      set((state) => {
        state.annotations = state.annotations.filter((annotation) => annotation.id !== id);
        // 선택에서도 제거
        state.selection.selectedAnnotationIds = state.selection.selectedAnnotationIds.filter(
          (selectedId) => selectedId !== id
        );
      });
    },

    cloneAnnotation: (id: string) => {
      set((state) => {
        const annotation = state.annotations.find((annotation) => annotation.id === id);
        if (annotation) {
          const clonedAnnotation = {
            ...annotation,
            id: `annotation-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            bbox: {
              ...annotation.bbox,
              x: annotation.bbox.x + 10,
              y: annotation.bbox.y + 10,
            }
          };
          state.annotations.push(clonedAnnotation);
        }
      });
    },

    moveAnnotation: (id: string, deltaX: number, deltaY: number) => {
      set((state) => {
        const annotation = state.annotations.find((annotation) => annotation.id === id);
        if (annotation) {
          // Move bbox
          annotation.bbox.x += deltaX;
          annotation.bbox.y += deltaY;

          // For arrow/line/lightning types, also move startPoint and endPoint
          if ((annotation.type === 'arrow' || annotation.type === 'line' || annotation.type === 'lightning') &&
            (annotation as any).startPoint && (annotation as any).endPoint) {
            (annotation as any).startPoint.x += deltaX;
            (annotation as any).startPoint.y += deltaY;
            (annotation as any).endPoint.x += deltaX;
            (annotation as any).endPoint.y += deltaY;
          }
        }
      });
    },

    resizeAnnotation: (id: string, newWidth: number, newHeight: number) => {
      set((state) => {
        const annotation = state.annotations.find((annotation) => annotation.id === id);
        if (annotation) {
          annotation.bbox.width = newWidth;
          annotation.bbox.height = newHeight;
        }
      });
    },

    updateAnnotationStyle: (id: string, style: Partial<Annotation['style']>) => {
      set((state) => {
        const annotation = state.annotations.find((annotation) => annotation.id === id);
        if (annotation) {
          annotation.style = { ...annotation.style, ...style };
        }
      });
    },

    // ============================================
    // Utility Actions
    // ============================================

    getSelectedAnnotations: () => {
      const state = get();
      return state.annotations.filter((annotation) =>
        state.selection.selectedAnnotationIds.includes(annotation.id)
      );
    },

    findAnnotation: (id: string) => {
      const state = get();
      return state.annotations.find((annotation) => annotation.id === id) || null;
    },

    filterAnnotations: (predicate: (annotation: Annotation) => boolean) => {
      const state = get();
      return state.annotations.filter(predicate);
    },

    // ============================================
    // Document Integration
    // ============================================

    getCurrentPageAnnotations: (pageId: string) => {
      const state = get();
      return state.annotations.filter((annotation) => annotation.pageId === pageId);
    },

    addAnnotationToPage: (pageId: string, annotation: Annotation) => {
      console.log(`➕ [AnnotationStore] addAnnotationToPage called with pageId: ${pageId}, annotation.id: ${annotation.id}`);
      set((state) => {
        const newAnnotation = { ...annotation, pageId };
        state.annotations.push(newAnnotation);
        console.log(`➕ [AnnotationStore] After push, annotations.length: ${state.annotations.length}`);
      });
    },

    removeAnnotationFromPage: (pageId: string, annotationId: string) => {
      set((state) => {
        const index = state.annotations.findIndex(
          (annotation) => annotation.id === annotationId && annotation.pageId === pageId
        );
        if (index !== -1) {
          state.annotations.splice(index, 1);
        }
      });
    },

    removeAnnotation: (annotationId: string) => {
      set((state) => {
        const index = state.annotations.findIndex(
          (annotation) => annotation.id === annotationId
        );
        if (index !== -1) {
          state.annotations.splice(index, 1);
        }
      });
    },

    selectAnnotations: (annotationIds: string[]) => {
      set((state) => {
        state.selection.selectedAnnotationIds = annotationIds;
      });
    },
  }))
);
