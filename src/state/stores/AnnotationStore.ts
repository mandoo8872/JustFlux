/**
 * Annotation Store - 주석 관련 상태 관리
 * 기존 documentStore에서 주석 관련 부분을 분리
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Annotation, SelectionState, ToolType } from '../../core/model/types';
import type { ArrowAnnotation, LineAnnotation } from '../../types/annotation';

/** 유니크 주석 ID 생성 */
function generateAnnotationId(): string {
  return `annotation-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface AnnotationStore {
  // 선택 상태
  selection: SelectionState;

  // 주석 관련 상태
  annotations: Annotation[];
  hoveredAnnotationId: string | null;
  draggedAnnotationId: string | null;

  // 로딩 상태
  isAnnotationLoading: boolean;
  annotationError: string | null;

  // ── Selection ──
  selectAnnotation: (id: string, multiSelect?: boolean) => void;
  clearSelection: () => void;
  setActiveTool: (tool: string) => void;
  setHoveredAnnotation: (id: string | null) => void;
  setDraggedAnnotation: (id: string | null) => void;
  selectAnnotations: (annotationIds: string[]) => void;

  // ── CRUD ──
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  /** 주석 삭제 + 선택 해제 (통합) */
  removeAnnotation: (annotationId: string) => void;
  cloneAnnotation: (id: string) => void;
  moveAnnotation: (id: string, deltaX: number, deltaY: number) => void;
  resizeAnnotation: (id: string, newWidth: number, newHeight: number) => void;
  updateAnnotationStyle: (id: string, style: Partial<Annotation['style']>) => void;

  // ── Query ──
  getSelectedAnnotations: () => Annotation[];
  findAnnotation: (id: string) => Annotation | null;
  filterAnnotations: (predicate: (annotation: Annotation) => boolean) => Annotation[];

  // ── Document Integration ──
  getCurrentPageAnnotations: (pageId: string) => Annotation[];
  addAnnotationToPage: (pageId: string, annotation: Annotation) => void;
  removeAnnotationFromPage: (pageId: string, annotationId: string) => void;

  // ── Layer Ordering ──
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
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
    annotations: [],
    hoveredAnnotationId: null,
    draggedAnnotationId: null,
    isAnnotationLoading: false,
    annotationError: null,

    // ============================================
    // Selection Actions
    // ============================================

    selectAnnotation: (id: string, multiSelect = false) => {
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
      });
    },

    clearSelection: () => {
      set((state) => {
        state.selection.selectedAnnotationIds = [];
      });
    },

    setActiveTool: (tool: string) => {
      set((state) => {
        state.selection.activeTool = tool as ToolType;
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

    cloneAnnotation: (id: string) => {
      set((state) => {
        const annotation = state.annotations.find((a) => a.id === id);
        if (annotation) {
          state.annotations.push({
            ...annotation,
            id: generateAnnotationId(),
            bbox: { ...annotation.bbox, x: annotation.bbox.x + 10, y: annotation.bbox.y + 10 },
          });
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

          // For arrow/line types, also move startPoint and endPoint
          if (annotation.type === 'arrow' || annotation.type === 'line') {
            const typed = annotation as ArrowAnnotation | LineAnnotation;
            typed.startPoint.x += deltaX;
            typed.startPoint.y += deltaY;
            typed.endPoint.x += deltaX;
            typed.endPoint.y += deltaY;
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
      set((state) => {
        const newAnnotation = { ...annotation, pageId };
        state.annotations.push(newAnnotation);
      });
    },

    removeAnnotationFromPage: (_pageId: string, annotationId: string) => {
      // pageId 필터 불필요 — ID는 글로벌 유니크. 호환성을 위해 시그니처 유지.
      get().removeAnnotation(annotationId);
    },

    removeAnnotation: (annotationId: string) => {
      set((state) => {
        state.annotations = state.annotations.filter((a) => a.id !== annotationId);
        state.selection.selectedAnnotationIds = state.selection.selectedAnnotationIds.filter(
          (id) => id !== annotationId
        );
      });
    },

    selectAnnotations: (annotationIds: string[]) => {
      set((state) => {
        state.selection.selectedAnnotationIds = annotationIds;
      });
    },

    // ============================================
    // Layer Ordering
    // ============================================

    bringToFront: (id: string) => {
      set((state) => {
        const index = state.annotations.findIndex(a => a.id === id);
        if (index !== -1 && index < state.annotations.length - 1) {
          const [annotation] = state.annotations.splice(index, 1);
          state.annotations.push(annotation);
        }
      });
    },

    sendToBack: (id: string) => {
      set((state) => {
        const index = state.annotations.findIndex(a => a.id === id);
        if (index > 0) {
          const [annotation] = state.annotations.splice(index, 1);
          state.annotations.unshift(annotation);
        }
      });
    },

    bringForward: (id: string) => {
      set((state) => {
        const index = state.annotations.findIndex(a => a.id === id);
        if (index !== -1 && index < state.annotations.length - 1) {
          // Swap with next
          const temp = state.annotations[index];
          state.annotations[index] = state.annotations[index + 1];
          state.annotations[index + 1] = temp;
        }
      });
    },

    sendBackward: (id: string) => {
      set((state) => {
        const index = state.annotations.findIndex(a => a.id === id);
        if (index > 0) {
          // Swap with previous
          const temp = state.annotations[index];
          state.annotations[index] = state.annotations[index - 1];
          state.annotations[index - 1] = temp;
        }
      });
    },
  }))
);
