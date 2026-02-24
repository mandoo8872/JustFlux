/**
 * History Store - 히스토리 관리 (Refactored)
 *
 * Undo/Redo를 실제로 동작하게 구현.
 *
 * 해결:
 *  - 주석 추가/수정/삭제에 대한 before/after 스냅샷을 저장
 *  - undo 시 before 상태 복원, redo 시 after 상태 복원
 *  - canUndo/canRedo를 반응적 상태로 관리 (getter가 아닌 set 기반)
 *  - AnnotationStore lazy import로 순환 의존성 방지
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Operation as JsonPatchOperation } from 'fast-json-patch';
import type { HistoryState, Annotation } from '../../core/model/types';

// ── Undo/Redo 액션 타입 ──

export interface AnnotationAction {
  type: 'add' | 'remove' | 'update';
  annotationId: string;
  pageId: string;
  before: Annotation | null;  // undo 시 적용할 상태
  after: Annotation | null;   // redo 시 적용할 상태
}

interface HistoryEntry {
  id: string;
  description: string;
  timestamp: number;
  forward: JsonPatchOperation[];
  backward: JsonPatchOperation[];
  actions: AnnotationAction[];
}

// ── Store 인터페이스 ──

interface HistoryStore {
  history: HistoryState;
  entries: HistoryEntry[];
  isHistoryLoading: boolean;
  historyError: string | null;
  canUndo: boolean;
  canRedo: boolean;

  addHistoryPatch: (description: string, forward: JsonPatchOperation[], backward: JsonPatchOperation[]) => void;
  pushAction: (description: string, actions: AnnotationAction[]) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  resetHistory: () => void;
  getCurrentIndex: () => number;
  getHistorySize: () => number;
}

// ── AnnotationStore 직접 import (ESM 호환) ──
import { useAnnotationStore } from './AnnotationStore';

function getAnnotationStore() {
  return useAnnotationStore.getState();
}

// ── 패치 적용 함수 ──

function applyActions(actions: AnnotationAction[], direction: 'undo' | 'redo'): void {
  const store = getAnnotationStore();

  for (const action of actions) {
    if (direction === 'undo') {
      switch (action.type) {
        case 'add':
          store.removeAnnotation(action.annotationId);
          break;
        case 'remove':
          if (action.before) {
            store.addAnnotationToPage(action.pageId, action.before);
          }
          break;
        case 'update':
          if (action.before) {
            store.updateAnnotation(action.annotationId, action.before);
          }
          break;
      }
    } else {
      switch (action.type) {
        case 'add':
          if (action.after) {
            store.addAnnotationToPage(action.pageId, action.after);
          }
          break;
        case 'remove':
          store.removeAnnotation(action.annotationId);
          break;
        case 'update':
          if (action.after) {
            store.updateAnnotation(action.annotationId, action.after);
          }
          break;
      }
    }
  }
}

/**
 * JSON Patch → AnnotationAction 변환 (기존 API 호환)
 */
function extractActionsFromPatches(
  forward: JsonPatchOperation[],
  backward: JsonPatchOperation[]
): AnnotationAction[] {
  const actions: AnnotationAction[] = [];

  for (const fwd of forward) {
    const path = fwd.path || '';
    if (!path.includes('/layers/annotations')) continue;

    if (fwd.op === 'add' && 'value' in fwd) {
      const annotation = fwd.value as Annotation;
      actions.push({
        type: 'add',
        annotationId: annotation.id || '',
        pageId: annotation.pageId || '',
        before: null,
        after: { ...annotation },
      });
    } else if (fwd.op === 'remove') {
      const bwd = backward.find(b => b.op === 'add' && 'value' in b);
      const before = bwd && 'value' in bwd ? bwd.value as Annotation : null;
      actions.push({
        type: 'remove',
        annotationId: before?.id || '',
        pageId: before?.pageId || '',
        before: before ? { ...before } : null,
        after: null,
      });
    } else if (fwd.op === 'replace' && 'value' in fwd) {
      const after = fwd.value as Annotation;
      const bwd = backward.find(b => b.op === 'replace' && 'value' in b);
      const before = bwd && 'value' in bwd ? bwd.value as Annotation : null;
      actions.push({
        type: 'update',
        annotationId: after.id || '',
        pageId: after.pageId || '',
        before: before ? { ...before } : null,
        after: { ...after },
      });
    }
  }

  return actions;
}

/** canUndo/canRedo 동기화 헬퍼 */
function syncCanFlags(state: { canUndo: boolean; canRedo: boolean; history: { currentIndex: number }; entries: HistoryEntry[] }) {
  state.canUndo = state.history.currentIndex >= 0;
  state.canRedo = state.history.currentIndex < state.entries.length - 1;
}

/** addHistoryPatch와 pushAction의 공통 엔트리 삽입 로직 */
function pushEntry(state: any, entry: HistoryEntry) {
  state.entries = state.entries.slice(0, state.history.currentIndex + 1);
  state.entries.push(entry);
  state.history.currentIndex = state.entries.length - 1;

  // 기존 patches 동기화 (호환용)
  state.history.patches = state.entries.map((e: HistoryEntry) => ({
    id: e.id,
    description: e.description,
    timestamp: e.timestamp,
    forward: e.forward as unknown[],
    backward: e.backward as unknown[],
  }));

  if (state.entries.length > state.history.maxSize) {
    state.entries.shift();
    state.history.patches.shift();
    state.history.currentIndex--;
  }

  syncCanFlags(state);
}

// ── Store 구현 ──

export const useHistoryStore = create<HistoryStore>()(
  immer((set, get) => ({
    history: {
      patches: [],
      currentIndex: -1,
      maxSize: 50,
    },
    entries: [],
    isHistoryLoading: false,
    historyError: null,
    canUndo: false,
    canRedo: false,

    addHistoryPatch: (description, forward, backward) => {
      const actions = extractActionsFromPatches(forward, backward);

      set((state) => {
        pushEntry(state, {
          id: `patch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          description,
          timestamp: Date.now(),
          forward,
          backward,
          actions,
        });
      });
    },

    pushAction: (description, actions) => {
      set((state) => {
        pushEntry(state, {
          id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          description,
          timestamp: Date.now(),
          forward: [],
          backward: [],
          actions,
        });
      });
    },

    undo: () => {
      const state = get();
      if (state.history.currentIndex < 0) return;

      const entry = state.entries[state.history.currentIndex];
      if (!entry) return;

      // undo 적용
      if (entry.actions.length > 0) {
        try {
          applyActions(entry.actions, 'undo');
        } catch (error) {
          console.error('[HistoryStore] Undo failed:', error);
          set((s) => { s.historyError = 'Undo failed'; });
          return;
        }
      }

      set((s) => {
        s.history.currentIndex--;
        s.historyError = null;
        syncCanFlags(s);
      });
    },

    redo: () => {
      const state = get();
      if (state.history.currentIndex >= state.entries.length - 1) return;

      const nextIndex = state.history.currentIndex + 1;
      const entry = state.entries[nextIndex];
      if (!entry) return;

      if (entry.actions.length > 0) {
        try {
          applyActions(entry.actions, 'redo');
        } catch (error) {
          console.error('[HistoryStore] Redo failed:', error);
          set((s) => { s.historyError = 'Redo failed'; });
          return;
        }
      }

      set((s) => {
        s.history.currentIndex++;
        s.historyError = null;
        syncCanFlags(s);
      });
    },

    clearHistory: () => {
      set((state) => {
        state.entries = [];
        state.history.patches = [];
        state.history.currentIndex = -1;
        syncCanFlags(state);
      });
    },

    resetHistory: () => {
      set((state) => {
        state.entries = [];
        state.history = { patches: [], currentIndex: -1, maxSize: 50 };
        syncCanFlags(state);
      });
    },

    getCurrentIndex: () => get().history.currentIndex,
    getHistorySize: () => get().entries.length,
  }))
);
