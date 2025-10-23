/**
 * Document State Management (Zustand + Immer)
 * Central store for document, pages, layers, and history
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { applyPatch, type Operation as JsonPatchOperation } from 'fast-json-patch';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type {
  Document,
  Page,
  Annotation,
  RasterLayer,
  HistoryState,
  ToolType,
  SelectionState,
  ViewState,
  ExportOptions,
} from '../core/model/types';
import { createDocument, createPage, createHistoryPatch } from '../core/model/factories';

// ============================================
// Store State Interface
// ============================================

interface DocumentStore {
  // Document state
  document: Document | null;
  currentPageId: string | null;
  pdfProxy: PDFDocumentProxy | null;
  
  // Page clipboard (for copy/paste)
  pageClipboard: Page | null;
  
  // History
  history: HistoryState;
  
  // Selection & Tools
  selection: SelectionState;
  
  // View
  view: ViewState;
  
  // Loading state
  isLoading: boolean;
  error: string | null;
  
  // ============================================
  // Document Actions
  // ============================================
  
  /** Create new document from PDF or images */
  loadDocument: (file: File) => Promise<void>;
  
  /** Clear current document */
  clearDocument: () => void;
  
  /** Set PDF proxy */
  setPdfProxy: (proxy: PDFDocumentProxy | null) => void;
  
  /** Set current page */
  setCurrentPage: (pageId: string) => void;
  
  // ============================================
  // Page Actions
  // ============================================
  
  /** Add new page */
  addPage: (page: Page) => void;
  
  /** Remove page (soft delete) */
  removePage: (pageId: string) => void;
  
  /** Restore deleted page */
  restorePage: (pageId: string) => void;
  
  /** Reorder pages */
  reorderPages: (pageIds: string[]) => void;
  
  /** Rotate page */
  rotatePage: (pageId: string, degrees: 90 | -90 | 180) => void;
  
  /** Duplicate page */
  duplicatePage: (pageId: string) => void;
  
  /** Copy page to clipboard */
  copyPage: (pageId: string) => void;
  
  /** Paste page after current page */
  pastePage: () => void;
  
  /** Get visible pages (non-deleted) */
  getVisiblePages: () => Page[];
  
  // ============================================
  // Annotation Actions
  // ============================================
  
  /** Add annotation to current page */
  addAnnotation: (annotation: Annotation) => void;
  
  /** Update annotation */
  updateAnnotation: (annotationId: string, updates: Partial<Annotation>) => void;
  
  /** Remove annotation */
  removeAnnotation: (annotationId: string) => void;
  
  /** Select annotations */
  selectAnnotations: (annotationIds: string[]) => void;
  
  // ============================================
  // Raster Layer Actions
  // ============================================
  
  /** Add raster layer */
  addRasterLayer: (layer: RasterLayer) => void;
  
  /** Update raster layer */
  updateRasterLayer: (layerId: string, updates: Partial<RasterLayer>) => void;
  
  /** Remove raster layer */
  removeRasterLayer: (layerId: string) => void;
  
  // ============================================
  // History Actions
  // ============================================
  
  /** Undo last action */
  undo: () => void;
  
  /** Redo last undone action */
  redo: () => void;
  
  /** Add history patch */
  addHistoryPatch: (description: string, forward: JsonPatchOperation[], backward: JsonPatchOperation[]) => void;
  
  // ============================================
  // Tool Actions
  // ============================================
  
  /** Set active tool */
  setActiveTool: (tool: ToolType) => void;
  
  /** Update tool options */
  setToolOptions: (options: Partial<SelectionState['toolOptions']>) => void;
  
  // ============================================
  // View Actions
  // ============================================
  
  /** Set zoom level */
  setZoom: (zoom: number) => void;
  
  /** Pan view */
  panView: (deltaX: number, deltaY: number) => void;
  
  /** Fit to width/height/page */
  fitView: (mode: ViewState['fitMode']) => void;
  
  // ============================================
  // Export Actions
  // ============================================
  
  /** Export document */
  exportDocument: (options: ExportOptions) => Promise<Uint8Array | null>;
}

// ============================================
// Store Implementation
// ============================================

export const useDocumentStore = create<DocumentStore>()(
  immer((set, get) => ({
    // Initial state
    document: null,
    currentPageId: null,
    pdfProxy: null,
    pageClipboard: null,
    history: {
      patches: [],
      currentIndex: -1,
      maxSize: 50,
    },
    selection: {
      selectedPageId: null,
      selectedAnnotationIds: [],
      selectedRasterLayerId: null,
      activeTool: 'select',
      toolOptions: {
        annotationStyle: {
          stroke: '#000000',
          strokeWidth: 2,
          fontFamily: 'sans-serif',
          fontSize: 16,
        },
      },
    },
    view: {
      zoom: 1.0,
      panX: 0,
      panY: 0,
      fitMode: 'width',
    },
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
        // Will be implemented with PDF.js worker
        // For now, create empty document
        const doc = createDocument({
          name: file.name,
          source: {
            kind: file.type === 'application/pdf' ? 'pdf' : 'images',
            fileName: file.name,
            fileSize: file.size,
          },
        });

        set((state) => {
          state.document = doc;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to load document';
          state.isLoading = false;
        });
      }
    },

    clearDocument: () => {
      set((state) => {
        state.document = null;
        state.currentPageId = null;
        state.pdfProxy = null;
        state.history = {
          patches: [],
          currentIndex: -1,
          maxSize: 50,
        };
        state.selection.selectedAnnotationIds = [];
        state.selection.selectedRasterLayerId = null;
      });
    },

    setPdfProxy: (proxy: PDFDocumentProxy | null) => {
      set({ pdfProxy: proxy });
    },

    setCurrentPage: (pageId: string) => {
      set((state) => {
        state.currentPageId = pageId;
        state.selection.selectedPageId = pageId;
        state.selection.selectedAnnotationIds = [];
      });
    },

    // ============================================
    // Page Actions
    // ============================================

    addPage: (page: Page) => {
      set((state) => {
        if (state.document) {
          state.document.pages.push(page);
          state.document.modifiedAt = Date.now();
        }
      });
    },

    removePage: (pageId: string) => {
      set((state) => {
        if (state.document) {
          const page = state.document.pages.find((p) => p.id === pageId);
          if (page) {
            // Soft delete
            page.deleted = true;
            state.document.modifiedAt = Date.now();
            
            // Clear selection if deleted page was selected
            if (state.currentPageId === pageId) {
              const visiblePages = state.document.pages.filter(p => !p.deleted);
              state.currentPageId = visiblePages[0]?.id || null;
            }
          }
        }
      });
    },

    restorePage: (pageId: string) => {
      set((state) => {
        if (state.document) {
          const page = state.document.pages.find((p) => p.id === pageId);
          if (page) {
            page.deleted = false;
            state.document.modifiedAt = Date.now();
          }
        }
      });
    },

    reorderPages: (pageIds: string[]) => {
      set((state) => {
        if (state.document) {
          const pageMap = new Map(state.document.pages.map((p) => [p.id, p]));
          state.document.pages = pageIds.map((id) => pageMap.get(id)!).filter(Boolean);
          
          // Update indices
          state.document.pages.forEach((p, i) => {
            p.index = i;
          });
          
          state.document.modifiedAt = Date.now();
        }
      });
    },

    rotatePage: (pageId: string, degrees: 90 | -90 | 180) => {
      set((state) => {
        if (state.document) {
          const page = state.document.pages.find((p) => p.id === pageId);
          if (page) {
            const newRotation = (page.rotation + degrees + 360) % 360;
            page.rotation = newRotation as 0 | 90 | 180 | 270;
            
            // Swap width/height for 90/-90 degree rotations
            if (degrees === 90 || degrees === -90) {
              [page.width, page.height] = [page.height, page.width];
            }
            
            state.document.modifiedAt = Date.now();
          }
        }
      });
    },

    duplicatePage: (pageId: string) => {
      set((state) => {
        if (state.document) {
          const page = state.document.pages.find((p) => p.id === pageId);
          if (page) {
            const newPage = createPage({
              docId: state.document.id,
              index: page.index + 1,
              width: page.width,
              height: page.height,
              rotation: page.rotation,
              pdfRef: page.pdfRef,
            });
            
            // Deep clone layers
            newPage.layers = {
              annotations: page.layers.annotations.map((a) => ({ ...a, id: `ann-${Date.now()}-${Math.random()}` })),
              rasters: page.layers.rasters.map((r) => ({ ...r, id: `raster-${Date.now()}-${Math.random()}` })),
            };
            
            state.document.pages.splice(page.index + 1, 0, newPage);
            
            // Update indices
            state.document.pages.forEach((p, i) => {
              p.index = i;
            });
            
            state.document.modifiedAt = Date.now();
          }
        }
      });
    },

    copyPage: (pageId: string) => {
      set((state) => {
        if (state.document) {
          const page = state.document.pages.find((p) => p.id === pageId);
          if (page) {
            // Deep clone the page for clipboard
            state.pageClipboard = JSON.parse(JSON.stringify(page));
          }
        }
      });
    },

    pastePage: () => {
      set((state) => {
        if (state.document && state.pageClipboard && state.currentPageId) {
          const currentPage = state.document.pages.find((p) => p.id === state.currentPageId);
          if (currentPage) {
            const newPage = createPage({
              docId: state.document.id,
              index: currentPage.index + 1,
              width: state.pageClipboard.width,
              height: state.pageClipboard.height,
              rotation: state.pageClipboard.rotation,
              pdfRef: state.pageClipboard.pdfRef,
            });
            
            // Deep clone layers from clipboard
            newPage.layers = {
              annotations: state.pageClipboard.layers.annotations.map((a) => ({ 
                ...a, 
                id: `ann-${Date.now()}-${Math.random()}`,
                pageId: newPage.id
              })),
              rasters: state.pageClipboard.layers.rasters.map((r) => ({ 
                ...r, 
                id: `raster-${Date.now()}-${Math.random()}`,
                pageId: newPage.id
              })),
            };
            
            state.document.pages.splice(currentPage.index + 1, 0, newPage);
            
            // Update indices
            state.document.pages.forEach((p, i) => {
              p.index = i;
            });
            
            state.document.modifiedAt = Date.now();
            state.currentPageId = newPage.id;
          }
        }
      });
    },

    getVisiblePages: () => {
      const state = get();
      if (!state.document) return [];
      return state.document.pages.filter(p => !p.deleted);
    },

    // ============================================
    // Annotation Actions
    // ============================================

    addAnnotation: (annotation: Annotation) => {
      set((state) => {
        if (state.document && state.currentPageId) {
          const page = state.document.pages.find((p) => p.id === state.currentPageId);
          if (page) {
            page.layers.annotations.push(annotation);
            state.document.modifiedAt = Date.now();
          }
        }
      });
    },

    updateAnnotation: (annotationId: string, updates: Partial<Annotation>) => {
      set((state) => {
        if (state.document && state.currentPageId) {
          const page = state.document.pages.find((p) => p.id === state.currentPageId);
          if (page) {
            const annotation = page.layers.annotations.find((a) => a.id === annotationId);
            if (annotation) {
              Object.assign(annotation, updates, { modifiedAt: Date.now() });
              state.document.modifiedAt = Date.now();
            }
          }
        }
      });
    },

    removeAnnotation: (annotationId: string) => {
      set((state) => {
        if (state.document && state.currentPageId) {
          const page = state.document.pages.find((p) => p.id === state.currentPageId);
          if (page) {
            const index = page.layers.annotations.findIndex((a) => a.id === annotationId);
            if (index !== -1) {
              page.layers.annotations.splice(index, 1);
              state.document.modifiedAt = Date.now();
            }
          }
        }
      });
    },

    selectAnnotations: (annotationIds: string[]) => {
      set((state) => {
        state.selection.selectedAnnotationIds = annotationIds;
      });
    },

    // ============================================
    // Raster Layer Actions
    // ============================================

    addRasterLayer: (layer: RasterLayer) => {
      set((state) => {
        if (state.document && state.currentPageId) {
          const page = state.document.pages.find((p) => p.id === state.currentPageId);
          if (page) {
            page.layers.rasters.push(layer);
            state.document.modifiedAt = Date.now();
          }
        }
      });
    },

    updateRasterLayer: (layerId: string, updates: Partial<RasterLayer>) => {
      set((state) => {
        if (state.document && state.currentPageId) {
          const page = state.document.pages.find((p) => p.id === state.currentPageId);
          if (page) {
            const layer = page.layers.rasters.find((r) => r.id === layerId);
            if (layer) {
              Object.assign(layer, updates, { modifiedAt: Date.now() });
              state.document.modifiedAt = Date.now();
            }
          }
        }
      });
    },

    removeRasterLayer: (layerId: string) => {
      set((state) => {
        if (state.document && state.currentPageId) {
          const page = state.document.pages.find((p) => p.id === state.currentPageId);
          if (page) {
            const index = page.layers.rasters.findIndex((r) => r.id === layerId);
            if (index !== -1) {
              page.layers.rasters.splice(index, 1);
              state.document.modifiedAt = Date.now();
            }
          }
        }
      });
    },

    // ============================================
    // History Actions
    // ============================================

    undo: () => {
      const state = get();
      if (state.history.currentIndex >= 0 && state.document) {
        const patch = state.history.patches[state.history.currentIndex];
        
        // Apply backward patch
        try {
          const result = applyPatch(state.document, patch.backward as JsonPatchOperation[], true, false);
          
          set((s) => {
            s.document = result.newDocument as Document;
            s.history.currentIndex -= 1;
          });
        } catch (error) {
          console.error('Undo failed:', error);
        }
      }
    },

    redo: () => {
      const state = get();
      if (state.history.currentIndex < state.history.patches.length - 1 && state.document) {
        const patch = state.history.patches[state.history.currentIndex + 1];
        
        // Apply forward patch
        try {
          const result = applyPatch(state.document, patch.forward as JsonPatchOperation[], true, false);
          
          set((s) => {
            s.document = result.newDocument as Document;
            s.history.currentIndex += 1;
          });
        } catch (error) {
          console.error('Redo failed:', error);
        }
      }
    },

    addHistoryPatch: (description: string, forward: JsonPatchOperation[], backward: JsonPatchOperation[]) => {
      set((state) => {
        const patch = createHistoryPatch({ description, forward, backward });
        
        // Remove any patches after current index (when adding new action after undo)
        state.history.patches = state.history.patches.slice(0, state.history.currentIndex + 1);
        
        // Add new patch
        state.history.patches.push(patch);
        state.history.currentIndex += 1;
        
        // Limit history size
        if (state.history.patches.length > state.history.maxSize) {
          state.history.patches.shift();
          state.history.currentIndex -= 1;
        }
      });
    },

    // ============================================
    // Tool Actions
    // ============================================

    setActiveTool: (tool: ToolType) => {
      set((state) => {
        state.selection.activeTool = tool;
        
        // Clear selection when switching to non-select tools
        if (tool !== 'select') {
          state.selection.selectedAnnotationIds = [];
          state.selection.selectedRasterLayerId = null;
        }
      });
    },

    setToolOptions: (options: Partial<SelectionState['toolOptions']>) => {
      set((state) => {
        state.selection.toolOptions = {
          ...state.selection.toolOptions,
          ...options,
        };
      });
    },

    // ============================================
    // View Actions
    // ============================================

    setZoom: (zoom: number) => {
      set((state) => {
        state.view.zoom = Math.max(0.1, Math.min(5.0, zoom));
        state.view.fitMode = 'custom';
      });
    },

    panView: (deltaX: number, deltaY: number) => {
      set((state) => {
        state.view.panX += deltaX;
        state.view.panY += deltaY;
      });
    },

    fitView: (mode: ViewState['fitMode']) => {
      set((state) => {
        state.view.fitMode = mode;
        // Zoom calculation will be done in the viewer component based on page size
      });
    },

    // ============================================
    // Export Actions
    // ============================================

    exportDocument: async (options: ExportOptions) => {
      // Will be implemented with export system
      console.log('Export requested:', options);
      return null;
    },
  }))
);

// ============================================
// Selector Hooks (for optimized re-renders)
// ============================================

export const useCurrentPage = () => {
  return useDocumentStore((state) => {
    if (!state.document || !state.currentPageId) return null;
    return state.document.pages.find((p) => p.id === state.currentPageId) || null;
  });
};

// Store empty array constant to prevent re-creation
const EMPTY_ARRAY: never[] = [];

export const usePageAnnotations = (pageId: string | null) => {
  return useDocumentStore((state) => {
    if (!state.document || !pageId) return EMPTY_ARRAY;
    const page = state.document.pages.find((p) => p.id === pageId);
    return page?.layers.annotations || EMPTY_ARRAY;
  });
};

export const usePageRasterLayers = (pageId: string | null) => {
  return useDocumentStore((state) => {
    if (!state.document || !pageId) return EMPTY_ARRAY;
    const page = state.document.pages.find((p) => p.id === pageId);
    return page?.layers.rasters || EMPTY_ARRAY;
  });
};

export const useCanUndo = () => {
  return useDocumentStore((state) => state.history.currentIndex >= 0);
};

export const useCanRedo = () => {
  return useDocumentStore((state) => {
    return state.history.currentIndex < state.history.patches.length - 1;
  });
};

export const usePdfProxy = () => {
  return useDocumentStore((state) => state.pdfProxy);
};

export const useCurrentPageIndex = () => {
  return useDocumentStore((state) => {
    if (!state.document || !state.currentPageId) return 0;
    const page = state.document.pages.find(p => p.id === state.currentPageId);
    return page?.index ?? 0;
  });
};

