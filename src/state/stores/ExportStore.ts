/**
 * Export Store - 내보내기 관리 전용
 * PDF, PNG, JPEG 등 다양한 형식의 내보내기 관리
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ExportOptions } from '../../core/model/types';

interface ExportStore {
  // 내보내기 상태
  exportOptions: ExportOptions;
  exportProgress: number;
  isExporting: boolean;
  
  // 내보내기 결과
  exportResult: any | null;
  exportError: string | null;
  
  // ============================================
  // Export Actions
  // ============================================
  
  /** 문서 내보내기 */
  exportDocument: (options: ExportOptions) => Promise<void>;
  
  /** 내보내기 옵션 설정 */
  setExportOptions: (options: Partial<ExportOptions>) => void;
  
  /** 내보내기 진행률 설정 */
  setExportProgress: (progress: number) => void;
  
  /** 내보내기 시작 */
  startExport: () => void;
  
  /** 내보내기 완료 */
  completeExport: (result: any) => void;
  
  /** 내보내기 실패 */
  failExport: (error: string) => void;
  
  /** 내보내기 취소 */
  cancelExport: () => void;
  
  /** 내보내기 리셋 */
  resetExport: () => void;
  
  // ============================================
  // Utility Actions
  // ============================================
  
  /** 내보내기 가능 여부 */
  canExport: boolean;
  
  /** 내보내기 형식별 옵션 가져오기 */
  getExportOptionsForFormat: (format: string) => ExportOptions;
  
  /** 지원되는 내보내기 형식 목록 */
  getSupportedFormats: () => string[];
}

export const useExportStore = create<ExportStore>()(
  immer((set, get) => ({
    // 초기 상태
    exportOptions: {
      format: 'pdf',
      quality: 100,
      includeAnnotations: true,
      includeLayers: true,
      pageRange: 'all',
      outputPath: '',
      fileName: 'document'
    },
    exportProgress: 0,
    isExporting: false,
    exportResult: null,
    exportError: null,
    
    // ============================================
    // Export Actions
    // ============================================
    
    exportDocument: async (options: ExportOptions) => {
      set((state) => {
        state.isExporting = true;
        state.exportProgress = 0;
        state.exportError = null;
        state.exportOptions = { ...state.exportOptions, ...options };
      });
      
      try {
        // 실제 내보내기 로직은 ExportService에서 처리
        // 여기서는 상태만 관리
        
        // 진행률 시뮬레이션
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          set((state) => {
            state.exportProgress = i;
          });
        }
        
        set((state) => {
          state.isExporting = false;
          state.exportProgress = 100;
          state.exportResult = { success: true, format: options.format };
        });
      } catch (error) {
        set((state) => {
          state.isExporting = false;
          state.exportError = error instanceof Error ? error.message : 'Export failed';
        });
      }
    },
    
    setExportOptions: (options: Partial<ExportOptions>) => {
      set((state) => {
        state.exportOptions = { ...state.exportOptions, ...options };
      });
    },
    
    setExportProgress: (progress: number) => {
      set((state) => {
        state.exportProgress = Math.max(0, Math.min(100, progress));
      });
    },
    
    startExport: () => {
      set((state) => {
        state.isExporting = true;
        state.exportProgress = 0;
        state.exportError = null;
      });
    },
    
    completeExport: (result: any) => {
      set((state) => {
        state.isExporting = false;
        state.exportProgress = 100;
        state.exportResult = result;
      });
    },
    
    failExport: (error: string) => {
      set((state) => {
        state.isExporting = false;
        state.exportError = error;
      });
    },
    
    cancelExport: () => {
      set((state) => {
        state.isExporting = false;
        state.exportProgress = 0;
      });
    },
    
    resetExport: () => {
      set((state) => {
        state.exportProgress = 0;
        state.isExporting = false;
        state.exportResult = null;
        state.exportError = null;
      });
    },
    
    // ============================================
    // Utility Actions
    // ============================================
    
    get canExport() {
      const state = get();
      return !state.isExporting && state.exportOptions.format !== 'pdf';
    },
    
    getExportOptionsForFormat: (format: string) => {
      const state = get();
      const baseOptions = { ...state.exportOptions };
      
      switch (format) {
        case 'pdf':
          return { ...baseOptions, format: 'pdf', quality: 100 };
        case 'png':
          return { ...baseOptions, format: 'png', quality: 90 };
        case 'jpeg':
          return { ...baseOptions, format: 'jpeg', quality: 85 };
        default:
          return baseOptions;
      }
    },
    
    getSupportedFormats: () => {
      return ['pdf', 'png', 'jpeg', 'svg', 'webp'];
    },
  }))
);
