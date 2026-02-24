/**
 * DocumentStore - 문서 메타데이터만 관리
 * 페이지, PDF, 레이어는 각각 전용 스토어에서 관리
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Document } from '../core/model/types';
// import { createDocument } from '../core/model/factories'; // FileService에서 사용

// ============================================
// Store State Interface
// ============================================

interface DocumentStore {
  document: Document | null;
  isLoading: boolean;
  error: string | null;

  loadDocument: (file: File) => Promise<void>;
  clearDocument: () => void;
  setDocument: (document: Document | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useDocumentStore = create<DocumentStore>()(
  immer((set, _get) => ({
    // Initial state
    document: null,
    isLoading: false,
    error: null,

    // ============================================
    // Document Actions
    // ============================================

    loadDocument: async (file: File) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        // FileService를 통한 파일 로딩
        const { FileService } = await import('../core/services/FileService');

        if (file.type === 'application/pdf') {
          await FileService.loadPdfFile(file);
        } else if (file.type.startsWith('image/')) {
          await FileService.loadImageFile(file);
        }

        set((state) => {
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to load file';
          state.isLoading = false;
        });
      }
    },

    clearDocument: () => {
      set((state) => {
        state.document = null;
        state.error = null;
      });
    },

    setDocument: (document: Document | null) => {
      set((state) => {
        state.document = document;
      });
    },

    setLoading: (loading: boolean) => {
      set((state) => {
        state.isLoading = loading;
      });
    },

    setError: (error: string | null) => {
      set((state) => {
        state.error = error;
      });
    }
  }))
);

export const useDocument = () => useDocumentStore((state) => state.document);
export const useIsLoading = () => useDocumentStore((state) => state.isLoading);
export const useError = () => useDocumentStore((state) => state.error);