/**
 * PageStore - 페이지 관리 전용 스토어
 * 페이지 생성, 삭제, 순서 변경 등 페이지 관련 상태만 관리
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Page } from '../../core/model/types';
import { createPage } from '../../core/model/factories';

interface PageStore {
  // Page state
  pages: Page[];
  currentPageId: string | null;
  pageClipboard: Page | null;

  // ============================================
  // Page Actions
  // ============================================

  /** Set current page */
  setCurrentPage: (pageId: string | null) => void;

  /** Add new page */
  addPage: (page: Page) => void;

  /** Set all pages (replace) */
  setPages: (pages: Page[]) => void;

  /** Remove page */
  removePage: (pageId: string) => void;

  /** Update page */
  updatePage: (pageId: string, updates: Partial<Page>) => void;

  /** Reorder pages */
  reorderPages: (pageIds: string[]) => void;

  /** Duplicate page */
  duplicatePage: (pageId: string) => void;

  /** Copy page to clipboard */
  copyPage: (pageId: string) => void;

  /** Paste page from clipboard */
  pastePage: (afterPageId: string) => void;

  /** Insert PDF pages */
  insertPdfPages: (afterPageId: string, pdfPages: Page[]) => void;

  // ============================================
  // Utility Actions
  // ============================================

  /** Get page by ID */
  getPage: (pageId: string) => Page | null;

  /** Get page index */
  getPageIndex: (pageId: string) => number;

  /** Get current page */
  getCurrentPage: () => Page | null;

  /** Clear all pages */
  clearPages: () => void;
}

export const usePageStore = create<PageStore>()(
  immer((set, get) => ({
    // Initial state
    pages: [],
    currentPageId: null,
    pageClipboard: null,

    // ============================================
    // Page Actions
    // ============================================

    setCurrentPage: (pageId: string | null) => {
      set((state) => {
        state.currentPageId = pageId;
      });
    },

    addPage: (page: Page) => {
      set((state) => {
        state.pages.push(page);
        state.currentPageId = page.id;
      });
    },

    setPages: (pages: Page[]) => {
      set((state) => {
        state.pages = pages;
        state.currentPageId = pages.length > 0 ? pages[0].id : null;
      });
    },

    removePage: (pageId: string) => {
      set((state) => {
        const index = state.pages.findIndex(p => p.id === pageId);
        if (index !== -1) {
          state.pages.splice(index, 1);

          // If removed page was current, set new current
          if (state.currentPageId === pageId) {
            state.currentPageId = state.pages.length > 0
              ? state.pages[Math.min(index, state.pages.length - 1)].id
              : null;
          }
        }
      });
    },

    updatePage: (pageId: string, updates: Partial<Page>) => {
      set((state) => {
        const page = state.pages.find(p => p.id === pageId);
        if (page) {
          Object.assign(page, updates);
        }
      });
    },

    reorderPages: (pageIds: string[]) => {
      set((state) => {
        const reorderedPages: Page[] = [];

        for (const pageId of pageIds) {
          const page = state.pages.find(p => p.id === pageId);
          if (page) {
            reorderedPages.push(page);
          }
        }

        // Add any remaining pages not in the reorder list
        for (const page of state.pages) {
          if (!pageIds.includes(page.id)) {
            reorderedPages.push(page);
          }
        }

        state.pages = reorderedPages;
      });
    },

    duplicatePage: (pageId: string) => {
      set((state) => {
        const originalPage = state.pages.find(p => p.id === pageId);
        if (originalPage) {
          const duplicatedPage = createPage({
            docId: originalPage.docId,
            width: originalPage.width,
            height: originalPage.height,
            index: state.pages.length
          });

          // Copy layers and annotations
          duplicatedPage.layers = { ...originalPage.layers };

          state.pages.push(duplicatedPage);
        }
      });
    },

    copyPage: (pageId: string) => {
      set((state) => {
        const page = state.pages.find(p => p.id === pageId);
        if (page) {
          state.pageClipboard = { ...page };
        }
      });
    },

    pastePage: (afterPageId: string) => {
      set((state) => {
        if (state.pageClipboard) {
          const afterIndex = state.pages.findIndex(p => p.id === afterPageId);
          const newPage = { ...state.pageClipboard };
          newPage.id = `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          if (afterIndex !== -1) {
            state.pages.splice(afterIndex + 1, 0, newPage);
          } else {
            state.pages.push(newPage);
          }
        }
      });
    },

    insertPdfPages: (afterPageId: string, pdfPages: Page[]) => {
      set((state) => {
        const afterIndex = state.pages.findIndex(p => p.id === afterPageId);

        if (afterIndex !== -1) {
          state.pages.splice(afterIndex + 1, 0, ...pdfPages);
        } else {
          state.pages.push(...pdfPages);
        }
      });
    },

    // ============================================
    // Utility Actions
    // ============================================

    getPage: (pageId: string) => {
      const state = get();
      return state.pages.find(p => p.id === pageId) || null;
    },

    getPageIndex: (pageId: string) => {
      const state = get();
      return state.pages.findIndex(p => p.id === pageId);
    },

    getCurrentPage: () => {
      const state = get();
      return state.pages.find(p => p.id === state.currentPageId) || null;
    },

    clearPages: () => {
      set((state) => {
        state.pages = [];
        state.currentPageId = null;
        state.pageClipboard = null;
      });
    }
  }))
);
