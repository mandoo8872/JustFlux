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

  // ── Multi-Select Operations ──
  alignAnnotations: (ids: string[], alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  distributeAnnotations: (ids: string[], direction: 'horizontal' | 'vertical') => void;
  groupAnnotations: (ids: string[]) => void;
  ungroupAnnotations: (ids: string[]) => void;
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
          // Auto-select group members
          const annotation = state.annotations.find(a => a.id === id);
          if (annotation?.groupId) {
            const groupIds = state.annotations
              .filter(a => a.groupId === annotation.groupId)
              .map(a => a.id);
            state.selection.selectedAnnotationIds = groupIds;
          } else {
            state.selection.selectedAnnotationIds = [id];
          }
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

          // For freehand/highlighter types, also move all points
          if ((annotation.type === 'freehand' || annotation.type === 'highlighter') && 'points' in annotation) {
            const points = (annotation as any).points as Array<{ x: number; y: number }>;
            if (Array.isArray(points)) {
              for (const point of points) {
                point.x += deltaX;
                point.y += deltaY;
              }
            }
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

    // ============================================
    // Multi-Select Operations
    // ============================================

    alignAnnotations: (ids: string[], alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
      set((state) => {
        const targets = state.annotations.filter(a => ids.includes(a.id));
        if (targets.length < 2) return;

        const bboxes = targets.map(a => a.bbox);
        const minX = Math.min(...bboxes.map(b => b.x));
        const maxX = Math.max(...bboxes.map(b => b.x + b.width));
        const minY = Math.min(...bboxes.map(b => b.y));
        const maxY = Math.max(...bboxes.map(b => b.y + b.height));
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        for (const a of targets) {
          const oldX = a.bbox.x;
          const oldY = a.bbox.y;
          let dx = 0, dy = 0;

          switch (alignment) {
            case 'left': dx = minX - oldX; break;
            case 'center': dx = centerX - (oldX + a.bbox.width / 2); break;
            case 'right': dx = maxX - (oldX + a.bbox.width); break;
            case 'top': dy = minY - oldY; break;
            case 'middle': dy = centerY - (oldY + a.bbox.height / 2); break;
            case 'bottom': dy = maxY - (oldY + a.bbox.height); break;
          }

          a.bbox.x += dx;
          a.bbox.y += dy;

          // Move startPoint/endPoint for arrow/line
          if ((a.type === 'arrow' || a.type === 'line') && 'startPoint' in a) {
            const typed = a as any;
            typed.startPoint.x += dx; typed.startPoint.y += dy;
            typed.endPoint.x += dx; typed.endPoint.y += dy;
          }
          // Move freehand points
          if ((a.type === 'freehand' || a.type === 'highlighter') && 'points' in a) {
            const pts = (a as any).points as Array<{ x: number; y: number }>;
            if (Array.isArray(pts)) { for (const p of pts) { p.x += dx; p.y += dy; } }
          }
        }
      });
    },

    distributeAnnotations: (ids: string[], direction: 'horizontal' | 'vertical') => {
      set((state) => {
        const targets = state.annotations.filter(a => ids.includes(a.id));
        if (targets.length < 3) return;

        if (direction === 'horizontal') {
          targets.sort((a, b) => a.bbox.x - b.bbox.x);
          const first = targets[0].bbox.x;
          const last = targets[targets.length - 1].bbox.x + targets[targets.length - 1].bbox.width;
          const totalWidth = targets.reduce((s, a) => s + a.bbox.width, 0);
          const gap = (last - first - totalWidth) / (targets.length - 1);

          let cursor = first;
          for (const a of targets) {
            const dx = cursor - a.bbox.x;
            a.bbox.x = cursor;
            if ((a.type === 'arrow' || a.type === 'line') && 'startPoint' in a) {
              const typed = a as any;
              typed.startPoint.x += dx; typed.endPoint.x += dx;
            }
            if ((a.type === 'freehand' || a.type === 'highlighter') && 'points' in a) {
              const pts = (a as any).points as Array<{ x: number; y: number }>;
              if (Array.isArray(pts)) { for (const p of pts) { p.x += dx; } }
            }
            cursor += a.bbox.width + gap;
          }
        } else {
          targets.sort((a, b) => a.bbox.y - b.bbox.y);
          const first = targets[0].bbox.y;
          const last = targets[targets.length - 1].bbox.y + targets[targets.length - 1].bbox.height;
          const totalHeight = targets.reduce((s, a) => s + a.bbox.height, 0);
          const gap = (last - first - totalHeight) / (targets.length - 1);

          let cursor = first;
          for (const a of targets) {
            const dy = cursor - a.bbox.y;
            a.bbox.y = cursor;
            if ((a.type === 'arrow' || a.type === 'line') && 'startPoint' in a) {
              const typed = a as any;
              typed.startPoint.y += dy; typed.endPoint.y += dy;
            }
            if ((a.type === 'freehand' || a.type === 'highlighter') && 'points' in a) {
              const pts = (a as any).points as Array<{ x: number; y: number }>;
              if (Array.isArray(pts)) { for (const p of pts) { p.y += dy; } }
            }
            cursor += a.bbox.height + gap;
          }
        }
      });
    },

    groupAnnotations: (ids: string[]) => {
      set((state) => {
        if (ids.length < 2) return;
        const groupId = generateAnnotationId();
        for (const a of state.annotations) {
          if (ids.includes(a.id)) {
            a.groupId = groupId;
          }
        }
      });
    },

    ungroupAnnotations: (ids: string[]) => {
      set((state) => {
        for (const a of state.annotations) {
          if (ids.includes(a.id)) {
            a.groupId = undefined;
          }
        }
      });
    },
  }))
);
