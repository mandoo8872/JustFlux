/**
 * History Store - 히스토리 관리 전용
 * Undo/Redo 기능과 히스토리 패치 관리
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Operation as JsonPatchOperation } from 'fast-json-patch';
import type { HistoryState } from '../../core/model/types';

interface HistoryStore {
  // 히스토리 상태
  history: HistoryState;
  
  // 로딩 상태
  isHistoryLoading: boolean;
  historyError: string | null;
  
  // ============================================
  // History Actions
  // ============================================
  
  /** 히스토리 패치 추가 */
  addHistoryPatch: (description: string, forward: JsonPatchOperation[], backward: JsonPatchOperation[]) => void;
  
  /** 실행 취소 */
  undo: () => void;
  
  /** 다시 실행 */
  redo: () => void;
  
  /** 히스토리 초기화 */
  clearHistory: () => void;
  
  /** 히스토리 리셋 */
  resetHistory: () => void;
  
  // ============================================
  // Utility Actions
  // ============================================
  
  /** 실행 취소 가능 여부 */
  canUndo: boolean;
  
  /** 다시 실행 가능 여부 */
  canRedo: boolean;
  
  /** 현재 히스토리 인덱스 */
  getCurrentIndex: () => number;
  
  /** 히스토리 크기 */
  getHistorySize: () => number;
}

export const useHistoryStore = create<HistoryStore>()(
  immer((set, get) => ({
    // 초기 상태
    history: {
      patches: [],
      currentIndex: -1,
      maxSize: 50
    },
    isHistoryLoading: false,
    historyError: null,
    
    // ============================================
    // History Actions
    // ============================================
    
    addHistoryPatch: (description: string, forward: JsonPatchOperation[], backward: JsonPatchOperation[]) => {
      set((state) => {
        const newPatch = {
          id: `patch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          description,
          forward,
          backward,
          timestamp: Date.now()
        };
        
        // 현재 인덱스 이후의 패치들 제거 (새로운 액션으로 인해)
        state.history.patches = state.history.patches.slice(0, state.history.currentIndex + 1);
        
        // 새 패치 추가
        state.history.patches.push(newPatch);
        state.history.currentIndex = state.history.patches.length - 1;
        
        // 최대 크기 제한
        if (state.history.patches.length > state.history.maxSize) {
          state.history.patches.shift();
          state.history.currentIndex--;
        }
      });
    },
    
    undo: () => {
      set((state) => {
        if (state.history.currentIndex >= 0) {
          const patch = state.history.patches[state.history.currentIndex];
          if (patch) {
            // backward 패치 적용
            try {
              // 실제 문서에 적용하는 로직은 DocumentStore에서 처리
              state.history.currentIndex--;
            } catch (error) {
              console.error('Undo failed:', error);
              state.historyError = 'Undo failed';
            }
          }
        }
      });
    },
    
    redo: () => {
      set((state) => {
        if (state.history.currentIndex < state.history.patches.length - 1) {
          state.history.currentIndex++;
          const patch = state.history.patches[state.history.currentIndex];
          if (patch) {
            // forward 패치 적용
            try {
              // 실제 문서에 적용하는 로직은 DocumentStore에서 처리
            } catch (error) {
              console.error('Redo failed:', error);
              state.historyError = 'Redo failed';
            }
          }
        }
      });
    },
    
    clearHistory: () => {
      set((state) => {
        state.history.patches = [];
        state.history.currentIndex = -1;
      });
    },
    
    resetHistory: () => {
      set((state) => {
        state.history = {
          patches: [],
          currentIndex: -1,
          maxSize: 50
        };
      });
    },
    
    // ============================================
    // Utility Actions
    // ============================================
    
    get canUndo() {
      const state = get();
      return state.history.currentIndex >= 0;
    },
    
    get canRedo() {
      const state = get();
      return state.history.currentIndex < state.history.patches.length - 1;
    },
    
    getCurrentIndex: () => {
      const state = get();
      return state.history.currentIndex;
    },
    
    getHistorySize: () => {
      const state = get();
      return state.history.patches.length;
    },
  }))
);
