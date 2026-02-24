/**
 * PDFStore - PDF 문서 관리 전용 스토어
 * PDF 로딩, 렌더링, 메타데이터 등 PDF 관련 상태만 관리
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { loadPdfFile } from '../../core/pdf/pdfLoader';

interface PDFStore {
  // PDF state
  pdfProxy: PDFDocumentProxy | null;
  pdfInfo: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
    pageCount: number;
  } | null;
  
  // Loading state
  isLoading: boolean;
  error: string | null;
  
  // ============================================
  // PDF Actions
  // ============================================
  
  /** Load PDF file */
  loadPdf: (file: File) => Promise<void>;
  
  /** Set PDF proxy */
  setPdfProxy: (proxy: PDFDocumentProxy | null) => void;
  
  /** Clear PDF */
  clearPdf: () => void;
  
  /** Get PDF info */
  getPdfInfo: () => any;
  
  /** Get page count */
  getPageCount: () => number;
  
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  
  /** Set error */
  setError: (error: string | null) => void;
}

export const usePDFStore = create<PDFStore>()(
  immer((set, get) => ({
    // Initial state
    pdfProxy: null,
    pdfInfo: null,
    isLoading: false,
    error: null,
    
    // ============================================
    // PDF Actions
    // ============================================
    
    loadPdf: async (file: File) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      try {
        const result = await loadPdfFile(file);
        
        set((state) => {
          state.pdfProxy = result.pdfProxy as any; // PDFDocumentProxy 타입 호환성 문제 해결
          state.pdfInfo = {
            title: result.document?.name,
            author: 'Unknown',
            subject: 'PDF Document',
            creator: 'JustFlux',
            producer: 'JustFlux',
            creationDate: new Date(result.document?.createdAt || Date.now()),
            modificationDate: new Date(result.document?.modifiedAt || Date.now()),
            pageCount: result.document?.pages?.length || 0
          };
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to load PDF';
          state.isLoading = false;
        });
      }
    },
    
    setPdfProxy: (proxy: PDFDocumentProxy | null) => {
      set((state) => {
        state.pdfProxy = proxy as any; // PDFDocumentProxy 타입 호환성 문제 해결
      });
    },
    
    clearPdf: () => {
      set((state) => {
        state.pdfProxy = null;
        state.pdfInfo = null;
        state.error = null;
      });
    },
    
    getPdfInfo: () => {
      const state = get();
      return state.pdfInfo;
    },
    
    getPageCount: () => {
      const state = get();
      return state.pdfInfo?.pageCount || 0;
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
