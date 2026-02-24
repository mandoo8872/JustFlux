/**
 * View Store - 뷰 관련 상태 관리
 * 줌, 팬, 뷰포트 등의 뷰 상태를 관리
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// ── 상수 ──
const MIN_SCALE = 0.1;
const MAX_SCALE = 5.0;
const ZOOM_FACTOR = 1.2;
const DEFAULT_SIDEBAR_WIDTH = 280;
const DEFAULT_HEADER_HEIGHT = 48;
const FIT_MARGIN = 0.9; // 90% 여백

interface ViewState {
  scale: number;
  panX: number;
  panY: number;
  viewportWidth: number;
  viewportHeight: number;
  isPanning: boolean;
  isZooming: boolean;
}

interface ViewStore {
  // 뷰 상태
  view: ViewState;

  // 로딩 상태
  isViewLoading: boolean;
  viewError: string | null;

  // ============================================
  // View Actions
  // ============================================

  /** 줌 설정 */
  setScale: (scale: number) => void;

  /** 줌 인 */
  zoomIn: () => void;

  /** 줌 아웃 */
  zoomOut: () => void;

  /** 줌 리셋 */
  resetZoom: () => void;

  /** 페이지에 맞춤 */
  fitToPage: (pageWidth: number, pageHeight: number) => void;

  /** 너비에 맞춤 */
  fitToWidth: (pageWidth: number) => void;

  /** 팬 설정 */
  setPan: (x: number, y: number) => void;

  /** 팬 시작 */
  startPanning: () => void;

  /** 팬 종료 */
  stopPanning: () => void;

  /** 뷰포트 크기 설정 */
  setViewportSize: (width: number, height: number) => void;

  /** 뷰 리셋 */
  resetView: () => void;

  // ============================================
  // Utility Actions
  // ============================================

  /** 화면 좌표를 문서 좌표로 변환 */
  screenToDocument: (screenX: number, screenY: number) => { x: number; y: number };

  /** 문서 좌표를 화면 좌표로 변환 */
  documentToScreen: (docX: number, docY: number) => { x: number; y: number };

  /** 뷰포트 내 좌표 확인 */
  isPointInViewport: (x: number, y: number) => boolean;
}

export const useViewStore = create<ViewStore>()(
  immer((set, get) => ({
    // 초기 상태
    view: {
      scale: 1.0,
      panX: 0,
      panY: 0,
      viewportWidth: 0,
      viewportHeight: 0,
      isPanning: false,
      isZooming: false
    },
    isViewLoading: false,
    viewError: null,

    // ============================================
    // View Actions
    // ============================================

    setScale: (scale: number) => {
      set((state) => {
        state.view.scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
      });
    },

    zoomIn: () => {
      set((state) => {
        state.view.scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, state.view.scale * ZOOM_FACTOR));
      });
    },

    zoomOut: () => {
      set((state) => {
        state.view.scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, state.view.scale / ZOOM_FACTOR));
      });
    },

    resetZoom: () => {
      set((state) => {
        state.view.scale = 1.0;
      });
    },

    fitToPage: (pageWidth: number, pageHeight: number) => {
      set((state) => {
        let { viewportWidth, viewportHeight } = state.view;

        if (viewportWidth === 0 || viewportHeight === 0) {
          viewportWidth = window.innerWidth - DEFAULT_SIDEBAR_WIDTH;
          viewportHeight = window.innerHeight - DEFAULT_HEADER_HEIGHT;
        }

        const scaleX = viewportWidth / pageWidth;
        const scaleY = viewportHeight / pageHeight;
        const scale = Math.min(scaleX, scaleY) * FIT_MARGIN;

        state.view.scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
        state.view.panX = (viewportWidth - pageWidth * scale) / 2;
        state.view.panY = (viewportHeight - pageHeight * scale) / 2;
      });
    },

    fitToWidth: (pageWidth: number) => {
      set((state) => {
        const scale = (state.view.viewportWidth / pageWidth) * FIT_MARGIN;
        state.view.scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
        state.view.panX = 0;
      });
    },

    setPan: (x: number, y: number) => {
      set((state) => {
        state.view.panX = x;
        state.view.panY = y;
      });
    },

    startPanning: () => {
      set((state) => {
        state.view.isPanning = true;
      });
    },

    stopPanning: () => {
      set((state) => {
        state.view.isPanning = false;
      });
    },

    setViewportSize: (width: number, height: number) => {
      set((state) => {
        state.view.viewportWidth = width;
        state.view.viewportHeight = height;
      });
    },

    resetView: () => {
      set((state) => {
        state.view.scale = 1.0;
        state.view.panX = 0;
        state.view.panY = 0;
        state.view.isPanning = false;
        state.view.isZooming = false;
      });
    },

    // ============================================
    // Utility Actions
    // ============================================

    screenToDocument: (screenX: number, screenY: number) => {
      const state = get();
      const { scale, panX, panY } = state.view;

      return {
        x: (screenX - panX) / scale,
        y: (screenY - panY) / scale
      };
    },

    documentToScreen: (docX: number, docY: number) => {
      const state = get();
      const { scale, panX, panY } = state.view;

      return {
        x: docX * scale + panX,
        y: docY * scale + panY
      };
    },

    isPointInViewport: (x: number, y: number) => {
      const state = get();
      const { viewportWidth, viewportHeight } = state.view;

      return x >= 0 && x <= viewportWidth && y >= 0 && y <= viewportHeight;
    }
  }))
);
