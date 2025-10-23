/**
 * Main application shell layout
 * Top: Header with file actions
 * Left: Page thumbnails
 * Center: Page viewer
 * Right: Toolbox
 */

import { useEffect, useCallback, useState } from 'react';
import {
  FileArrowUp,
  FloppyDisk,
  ArrowCounterClockwise,
  ArrowClockwise,
  CaretLeft,
  CaretRight,
  X,
  Plus,
  File,
} from 'phosphor-react';
import {
  useDocumentStore,
  useCanUndo,
  useCanRedo,
  useCurrentPage,
  usePdfProxy,
  useCurrentPageIndex,
} from '../../state/documentStore';
import { loadPdfFile } from '../../core/pdf/pdfLoader';
import { createPage } from '../../core/model/factories';
import { PageView } from '../viewer/PageView';
import { ZoomControl } from '../viewer/ZoomControl';
import { PageNavigator } from '../viewer/PageNavigator';
import { ThumbnailSidebar } from '../viewer/ThumbnailSidebar';
import { AnnotationLayer } from '../viewer/AnnotationLayer';
import { AnnotationToolbox } from '../toolbox/AnnotationToolbox';
import { AnnotationStylePanel } from '../toolbox/AnnotationStylePanel';
import { ExportPanel } from '../export/ExportPanel';
import type { Annotation, Document as JFDocument } from '../../core/model/types';
import type { PDFDocumentProxy } from 'pdfjs-dist';

// Tab interface for multi-document management
interface DocumentTab {
  id: string;
  name: string;
  document: JFDocument | null;
  pdfProxy: PDFDocumentProxy | null;
}

// Resizer Handle Component with hover state
function ResizerHandle({ 
  sidebarWidth, 
  isResizing, 
  onMouseDown,
  headerHeight
}: { 
  sidebarWidth: number; 
  isResizing: boolean; 
  onMouseDown: (e: React.MouseEvent) => void;
  headerHeight: number;
}) {
  const [isHovering, setIsHovering] = useState(false);
  
  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{ 
        position: 'fixed',
        top: `${headerHeight}px`,
        bottom: 0,
        left: `${sidebarWidth - 2}px`,
        width: isResizing ? '24px' : '20px',
        cursor: 'col-resize',
        background: isResizing 
          ? 'linear-gradient(to right, rgb(168, 85, 247), rgb(59, 130, 246))' 
          : (isHovering ? 'rgba(243, 232, 255, 0.5)' : 'transparent'),
        transition: 'all 0.2s ease-in-out',
        zIndex: 50
      }}
    >
      {/* Always Visible Subtle Line */}
      <div style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        top: 0,
        bottom: 0,
        width: '4px',
        backgroundColor: 'rgb(216, 180, 254)',
        opacity: (isResizing || isHovering) ? 0.8 : 0.4,
        transition: 'opacity 0.2s ease-in-out',
        pointerEvents: 'none'
      }} />
      
      {/* Visible Handle on Hover/Resize */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: (isResizing || isHovering) ? 1 : 0,
        transition: 'all 0.2s ease-in-out',
        pointerEvents: 'none'
      }}>
        <div style={{
          width: '40px',
          height: '128px',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '3px solid rgb(192, 132, 252)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                width: '6px',
                height: '24px',
                background: 'linear-gradient(to bottom, rgb(168, 85, 247), rgb(59, 130, 246))',
                borderRadius: '9999px'
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Shell() {
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [insertedPdfPages, setInsertedPdfPages] = useState<Set<string>>(new Set());
  const [insertedPdfProxies, setInsertedPdfProxies] = useState<Map<string, PDFDocumentProxy>>(new Map());
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Tabs state
  const [tabs, setTabs] = useState<DocumentTab[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(-1);
  
  const document = useDocumentStore((state) => state.document);
  const isLoading = useDocumentStore((state) => state.isLoading);
  const error = useDocumentStore((state) => state.error);
  const setCurrentPage = useDocumentStore((state) => state.setCurrentPage);
  const setPdfProxy = useDocumentStore((state) => state.setPdfProxy);
  const undo = useDocumentStore((state) => state.undo);
  const redo = useDocumentStore((state) => state.redo);
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const pdfProxy = usePdfProxy();
  const currentPage = useCurrentPage();
  const currentPageIndex = useCurrentPageIndex();

  // Page actions
  const addPage = useDocumentStore((state) => state.addPage);
  const removePage = useDocumentStore((state) => state.removePage);
  const reorderPages = useDocumentStore((state) => state.reorderPages);
  const duplicatePage = useDocumentStore((state) => state.duplicatePage);
  const addHistoryPatch = useDocumentStore((state) => state.addHistoryPatch);

  // View state
  const view = useDocumentStore((state) => state.view);
  const setZoom = useDocumentStore((state) => state.setZoom);
  const fitView = useDocumentStore((state) => state.fitView);

  // Selection & Tools
  const selection = useDocumentStore((state) => state.selection);
  const setActiveTool = useDocumentStore((state) => state.setActiveTool);
  const selectAnnotations = useDocumentStore((state) => state.selectAnnotations);
  const addAnnotation = useDocumentStore((state) => state.addAnnotation);
  const updateAnnotation = useDocumentStore((state) => state.updateAnnotation);
  const removeAnnotation = useDocumentStore((state) => state.removeAnnotation);

  // Calculate optimal zoom to fit SINGLE page in viewport
  const calculateFitToPageZoom = useCallback(() => {
    if (!document || !currentPage) return;

    const sidebarOffset = isSidebarCollapsed ? 0 : sidebarWidth;
    const headerHeight = tabs.length > 0 ? 95 : 48;
    
    // INLINE STYLES: paddingTop: 16px, paddingBottom: 12px, paddingLeft/Right: 16px, gap: 192px
    const canvasPaddingX = 16; // 16px each side (minimal)
    const canvasPaddingTop = 16; // 16px (minimal)
    const canvasPaddingBottom = 12; // 12px (minimal)
    
    const toolbarSpace = 35; // Minimal toolbar offset
    const pageBadgeSpace = 20; // Minimal for badge and PageNavigator
    
    // Calculate offsets
    const totalHorizontalOffset = sidebarOffset + toolbarSpace + (canvasPaddingX * 2);
    const totalVerticalOffset = headerHeight + canvasPaddingTop + canvasPaddingBottom + pageBadgeSpace;
    
    // Available space for SINGLE page
    const availableWidth = window.innerWidth - totalHorizontalOffset;
    const availableHeight = window.innerHeight - totalVerticalOffset;

    const pageWidth = currentPage.width;
    const pageHeight = currentPage.height;

    // Calculate scales to fill available space
    const scaleWidth = availableWidth / pageWidth;
    const scaleHeight = availableHeight / pageHeight;
    
    // Use MINIMUM to fit - NO multiplier for maximum fill
    const optimalScale = Math.min(scaleWidth, scaleHeight);
    // For fit mode, use a much lower minimum to ensure proper fitting
    const minScale = view.fitMode === 'page' ? 0.05 : 0.25;
    const finalScale = Math.max(Math.min(optimalScale, 3.0), minScale);

    console.log('🎯 [FIT] CANVAS-FILL MODE:', { 
      window: { w: window.innerWidth, h: window.innerHeight },
      offsets: { 
        sidebar: sidebarOffset,
        header: headerHeight,
        toolbar: toolbarSpace,
        paddingX: canvasPaddingX * 2,
        paddingTop: canvasPaddingTop,
        paddingBottom: canvasPaddingBottom,
        badge: pageBadgeSpace,
        totalH: totalHorizontalOffset,
        totalV: totalVerticalOffset 
      },
      available: { w: availableWidth, h: availableHeight },
      page: { w: pageWidth, h: pageHeight },
      rendered: { w: Math.round(pageWidth * finalScale), h: Math.round(pageHeight * finalScale) },
      calculated: {
        scaleByWidth: (scaleWidth * 100).toFixed(1) + '%', 
        scaleByHeight: (scaleHeight * 100).toFixed(1) + '%',
        ZOOM: `🔥 ${(finalScale * 100).toFixed(1)}%`,
        limiting: scaleWidth < scaleHeight ? '📏 WIDTH' : '📐 HEIGHT',
        shouldFill: scaleWidth < scaleHeight ? 
          `✅ Width will fill ${availableWidth}px` : 
          `✅ Height will fill ${availableHeight}px`
      }
    });
    
    setZoom(finalScale);
  }, [document, currentPage, sidebarWidth, isSidebarCollapsed, setZoom, tabs.length]);

  // Handle file selection - create new tab
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      try {
        const result = await loadPdfFile(file);

        // Create new tab
        const newTab: DocumentTab = {
          id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          document: result.document,
          pdfProxy: result.pdfProxy,
        };

        setTabs(prev => {
          const newTabs = [...prev, newTab];
          return newTabs;
        });
        
        const newTabIndex = tabs.length;
        setActiveTabIndex(newTabIndex);

        // Update store
        useDocumentStore.setState({
          document: result.document,
          currentPageId: result.document.pages[0]?.id || null,
          isLoading: false,
          error: null,
        });

        setPdfProxy(result.pdfProxy);
        
        // Auto-fit to viewport after loading - FORCE initial fit
        fitView('page'); // Set fitMode first
        setTimeout(() => {
          calculateFitToPageZoom(); // Calculate and apply zoom
        }, 500); // Increased delay for PDF rendering
      } catch (err) {
        useDocumentStore.setState({
          error: err instanceof Error ? err.message : 'Failed to load PDF',
          isLoading: false,
        });
      }
    }

    // Reset input
    e.target.value = '';
  };
  
  // Switch tab
  const handleTabSwitch = useCallback((index: number) => {
    if (index >= 0 && index < tabs.length) {
      const tab = tabs[index];
      setActiveTabIndex(index);
      
      // Update store
      if (tab.document) {
        useDocumentStore.setState({
          document: tab.document,
          currentPageId: tab.document.pages[0]?.id || null,
        });
      }
      if (tab.pdfProxy) {
        setPdfProxy(tab.pdfProxy);
      }
      
      // Recalculate zoom for new tab
      fitView('page'); // Set fitMode first
      setTimeout(() => {
        calculateFitToPageZoom();
      }, 150);
    }
  }, [tabs, setPdfProxy, fitView, calculateFitToPageZoom]);
  
  // Close tab
  const handleTabClose = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setTabs(prev => {
      const newTabs = [...prev];
      newTabs.splice(index, 1);
      
      // Adjust active tab
      if (newTabs.length === 0) {
        setActiveTabIndex(-1);
        useDocumentStore.setState({
          document: null,
          currentPageId: null,
        });
        setPdfProxy(null);
      } else if (activeTabIndex === index) {
        // Closing active tab, switch to previous or next
        const newIndex = index > 0 ? index - 1 : 0;
        setActiveTabIndex(newIndex);
        const newTab = newTabs[newIndex];
        if (newTab.document) {
          useDocumentStore.setState({
            document: newTab.document,
            currentPageId: newTab.document.pages[0]?.id || null,
          });
        }
        if (newTab.pdfProxy) setPdfProxy(newTab.pdfProxy);
      } else if (activeTabIndex > index) {
        // Adjust index if closed tab was before active
        setActiveTabIndex(prev => prev - 1);
      }
      
      return newTabs;
    });
  }, [activeTabIndex, setPdfProxy]);

  // Handle page change with auto-scroll
  const handlePageChange = useCallback(
    (pageIndex: number) => {
      if (document && document.pages[pageIndex]) {
        const pageId = document.pages[pageIndex].id;
        setCurrentPage(pageId);
        
        // Auto-scroll to the page (top aligned)
        setTimeout(() => {
          const pageElement = window.document.getElementById(`page-${pageId}`);
          if (pageElement) {
            pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    },
    [document, setCurrentPage]
  );

  // Handle page select from thumbnail with auto-scroll
  const handlePageSelect = useCallback(
    (pageId: string) => {
      setCurrentPage(pageId);
      
      // Auto-scroll to the page (top aligned)
      setTimeout(() => {
        const pageElement = window.document.getElementById(`page-${pageId}`);
        if (pageElement) {
          pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

      // Recalculate zoom if in fit mode (for different page sizes)
      if (view.fitMode === 'page') {
        setTimeout(() => {
          calculateFitToPageZoom();
        }, 100);
      }
    },
    [setCurrentPage, view.fitMode, calculateFitToPageZoom]
  );

  // Page management handlers
  const handlePageReorder = useCallback(
    (pageIds: string[]) => {
      reorderPages(pageIds);
    },
    [reorderPages]
  );

  const handlePageDuplicate = useCallback(
    (pageId: string) => {
      duplicatePage(pageId);
    },
    [duplicatePage]
  );

  const handlePageDelete = useCallback(
    (pageId: string) => {
      removePage(pageId);
    },
    [removePage]
  );

  const handleAddBlankPage = useCallback(
    (afterPageId: string, width: number, height: number) => {
      if (!document) return;

      const afterPage = document.pages.find(p => p.id === afterPageId);
      if (!afterPage) return;

      // Create new page with temporary index
      const newPage = createPage({
        docId: document.id,
        index: 0, // Temporary, will be set by reorderPages
        width,
        height,
        rotation: 0,
      });

      // Get current page IDs and insert new page at correct position
      const currentPageIds = document.pages.map(p => p.id);
      const insertIndex = afterPage.index + 1;
      currentPageIds.splice(insertIndex, 0, newPage.id);

      // Add page (goes to end of array)
      addPage(newPage);
      
      // Reorder to correct position
      reorderPages(currentPageIds);

      // Switch to new page
      setCurrentPage(newPage.id);
    },
    [document, addPage, reorderPages, setCurrentPage]
  );

  const handleAddPdfPages = useCallback(
    async (afterPageId: string, file: File) => {
      if (!document) return;

      try {
        const afterPage = document.pages.find(p => p.id === afterPageId);
        if (!afterPage) return;

        // Load PDF
        const pdfData = await loadPdfFile(file);
        if (!pdfData) return;

        const { document: newDoc, pdfProxy: newPdfProxy } = pdfData;

        // Get current page IDs before adding new pages
        const insertIndex = afterPage.index + 1;
        const currentPageIds = document.pages.map(p => p.id);
        
        // Create new pages with temporary indices
        const newPages = newDoc.pages.map((p) => {
          console.log('🔍 [Shell] Creating new page from PDF page:', p);
          const newPage = createPage({
            docId: document.id,
            index: 0, // Temporary, will be set by reorderPages
            width: p.width,
            height: p.height,
            rotation: p.rotation,
            pdfRef: p.pdfRef,
          });
          
          console.log('🔍 [Shell] Created new page:', newPage);
          
          // Deep clone layers
          newPage.layers = {
            annotations: p.layers.annotations.map((a) => ({ ...a, id: `ann-${Date.now()}-${Math.random()}`, pageId: newPage.id })),
            rasters: p.layers.rasters.map((r) => ({ ...r, id: `raster-${Date.now()}-${Math.random()}`, pageId: newPage.id })),
          };
          
          return newPage;
        });

        // Insert new page IDs at correct position
        currentPageIds.splice(insertIndex, 0, ...newPages.map(p => p.id));

        // Add all pages (they go to end of array)
        newPages.forEach(p => addPage(p));

        // Track inserted PDF pages and their proxy
        const newPageIds = newPages.map(p => p.id);
        setInsertedPdfPages(prev => new Set([...prev, ...newPageIds]));
        
        // Store PDF proxy for inserted pages
        const newPdfProxyMap = new Map<string, PDFDocumentProxy>();
        newPages.forEach(page => {
          newPdfProxyMap.set(page.id, newPdfProxy);
        });
        setInsertedPdfProxies(prev => new Map([...prev, ...newPdfProxyMap]));

        // Reorder to correct positions
        reorderPages(currentPageIds);

        // Switch to first inserted page
        if (newPages.length > 0) {
          setCurrentPage(newPages[0].id);
        }

        console.log(`✅ [Pages] Inserted ${newPages.length} pages from ${file.name}`);
      } catch (error) {
        console.error('❌ [Pages] Failed to insert PDF pages:', error);
      }
    },
    [document, addPage, reorderPages, setCurrentPage]
  );

  // Sidebar resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = Math.max(180, Math.min(400, e.clientX - 16));
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      // Recalculate zoom after sidebar resize if in fit mode
      if (view.fitMode === 'page') {
        setTimeout(() => {
          calculateFitToPageZoom();
        }, 100);
      }
    };

    if (isResizing) {
      window.document.addEventListener('mousemove', handleMouseMove);
      window.document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.document.removeEventListener('mousemove', handleMouseMove);
      window.document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, view.fitMode, calculateFitToPageZoom]);

  // Auto-fit on window resize and sidebar change
  useEffect(() => {
    if (!document || !currentPage) return;

    const handleResize = () => {
      // Debounce resize events
      clearTimeout((window as any)._resizeTimer);
      (window as any)._resizeTimer = setTimeout(() => {
        if (view.fitMode === 'page') {
          calculateFitToPageZoom();
        }
      }, 100);
    };

    // Always recalculate when dependencies change
    if (view.fitMode === 'page') {
      // Small delay to ensure layout is settled
      setTimeout(() => {
        calculateFitToPageZoom();
      }, 50);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout((window as any)._resizeTimer);
    };
  }, [document, currentPage, view.fitMode, sidebarWidth, isSidebarCollapsed, calculateFitToPageZoom, tabs.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      // Global shortcuts
      if (cmdKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (cmdKey && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if (cmdKey && e.key === 's') {
        e.preventDefault();
        if (document) {
          setExportModalOpen(true);
        }
      } else if (cmdKey && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setZoom(Math.min(view.zoom + 0.1, 4.0));
      } else if (cmdKey && e.key === '-') {
        e.preventDefault();
        setZoom(Math.max(view.zoom - 0.1, 0.25));
      } else if (cmdKey && e.key === '0') {
        e.preventDefault();
        setZoom(1.0);
      }

      // Tool shortcuts (single key)
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
            e.preventDefault();
            setActiveTool('select');
            break;
          case 'h':
            e.preventDefault();
            setActiveTool('pan');
            break;
          case 't':
            e.preventDefault();
            setActiveTool('text');
            break;
          case 'r':
            e.preventDefault();
            setActiveTool('rect');
            break;
          case 'o':
            e.preventDefault();
            setActiveTool('ellipse');
            break;
          case 'a':
            e.preventDefault();
            setActiveTool('arrow');
            break;
          case 'b':
            e.preventDefault();
            setActiveTool('brush');
            break;
          case 'c':
            e.preventDefault();
            setActiveTool('ellipse');
            break;
          case 'e':
            e.preventDefault();
            setActiveTool('eraser');
            break;
          case 'j':
            e.preventDefault();
            setActiveTool('heart');
            break;
          case 'k':
            e.preventDefault();
            setActiveTool('sticker');
            break;
          case 'l':
            e.preventDefault();
            setActiveTool('line');
            break;
          case 'm':
            e.preventDefault();
            setActiveTool('zoom');
            break;
          case 's':
            e.preventDefault();
            setActiveTool('star');
            break;
          case 'x':
            e.preventDefault();
            setActiveTool('crop');
            break;
          case 'z':
            e.preventDefault();
            setActiveTool('lightning');
            break;
        }
      }

      // Arrow keys for page navigation (only if not in input/textarea)
      if (!document || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentPageIndex > 0) {
          handlePageChange(currentPageIndex - 1);
        }
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentPageIndex < document.pages.length - 1) {
          handlePageChange(currentPageIndex + 1);
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        handlePageChange(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        handlePageChange(document.pages.length - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, view.zoom, setZoom, document, currentPageIndex, handlePageChange, setActiveTool]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8f9fa' }}>
      {/* Minimal Top Bar with Tabs - Inline Styles */}
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid rgba(229, 231, 235, 0.5)' }}>
        {/* Main Top Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '48px', paddingLeft: '16px', paddingRight: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'linear-gradient(to bottom right, rgb(168, 85, 247), rgb(59, 130, 246))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>JF</span>
              </div>
              <span style={{
                fontSize: '14px',
                fontWeight: 'bold',
                background: 'linear-gradient(to right, rgb(147, 51, 234), rgb(37, 99, 235))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>JustFlux</span>
            </div>
          {document && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px', paddingLeft: '12px', borderLeft: '1px solid rgb(229, 231, 235)' }}>
                <span style={{ fontSize: '14px', color: 'rgb(75, 85, 99)' }}>{document.name}</span>
                <span style={{ fontSize: '12px', color: 'rgb(156, 163, 175)' }}>
                  {document.pages.length}p
                </span>
              </div>
          )}
        </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Undo/Redo - Minimal */}
          <button
            onClick={undo}
            disabled={!canUndo}
              style={{
                padding: '8px',
                borderRadius: '6px',
                transition: 'background-color 0.2s ease-in-out',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: canUndo ? 'pointer' : 'not-allowed',
                opacity: canUndo ? 1 : 0.3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => { if (canUndo) e.currentTarget.style.backgroundColor = 'rgb(243, 244, 246)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              title="실행 취소"
            >
              <ArrowCounterClockwise size={18} weight="regular" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
              style={{
                padding: '8px',
                borderRadius: '6px',
                transition: 'background-color 0.2s ease-in-out',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: canRedo ? 'pointer' : 'not-allowed',
                opacity: canRedo ? 1 : 0.3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => { if (canRedo) e.currentTarget.style.backgroundColor = 'rgb(243, 244, 246)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              title="다시 실행"
            >
              <ArrowClockwise size={18} weight="regular" />
          </button>

            <div style={{ width: '1px', height: '20px', backgroundColor: 'rgb(229, 231, 235)', marginLeft: '4px', marginRight: '4px' }} />

            {/* Upload - Modern Pill */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              paddingLeft: '16px',
              paddingRight: '16px',
              paddingTop: '8px',
              paddingBottom: '8px',
              background: 'linear-gradient(to right, rgb(168, 85, 247), rgb(59, 130, 246))',
              color: 'white',
              fontSize: '14px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              boxShadow: '0 10px 15px -3px rgba(168, 85, 247, 0.25)',
              fontWeight: '600'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to right, rgb(147, 51, 234), rgb(37, 99, 235))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to right, rgb(168, 85, 247), rgb(59, 130, 246))';
            }}
            >
              <FileArrowUp size={16} weight="bold" />
              <span>열기</span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
                style={{ display: 'none' }}
            />
          </label>

            {/* Export - Modern Pill */}
          {document && (
            <button
                onClick={() => setExportModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  border: '1px solid rgb(229, 231, 235)',
                  backgroundColor: 'white',
                  color: 'rgb(55, 65, 81)',
                  fontSize: '14px',
                  borderRadius: '8px',
                  transition: 'background-color 0.2s ease-in-out',
                  fontWeight: '600',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgb(249, 250, 251)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
                title="내보내기"
              >
                <FloppyDisk size={16} weight="bold" />
                <span>내보내기</span>
            </button>
          )}
        </div>
        </div>
        
        {/* Tabs Bar - Modern Pills */}
        {tabs.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            paddingLeft: '12px',
            paddingRight: '12px',
            paddingTop: '8px',
            paddingBottom: '8px',
            background: 'linear-gradient(to right, rgb(248, 250, 252), rgb(249, 250, 251))',
            borderTop: '1px solid rgba(229, 231, 235, 0.5)',
            overflowX: 'auto'
          }}>
            {tabs.map((tab, index) => {
              const isActive = activeTabIndex === index;
              return (
                <div
                  key={tab.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    paddingLeft: '12px',
                    paddingRight: '12px',
                    paddingTop: '6px',
                    paddingBottom: '6px',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease-in-out',
                    minWidth: '100px',
                    maxWidth: '180px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    background: isActive 
                      ? 'linear-gradient(to right, rgb(168, 85, 247), rgb(59, 130, 246))' 
                      : 'white',
                    color: isActive ? 'white' : 'rgb(75, 85, 99)',
                    fontWeight: isActive ? 'bold' : 'normal',
                    boxShadow: isActive 
                      ? '0 10px 15px -3px rgba(168, 85, 247, 0.3)' 
                      : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgb(243, 244, 246)';
                      e.currentTarget.style.color = 'rgb(31, 41, 55)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.color = 'rgb(75, 85, 99)';
                    }
                  }}
                >
                  <File 
                    size={14} 
                    weight={isActive ? "fill" : "duotone"}
                    style={{ flexShrink: 0 }}
                    onClick={() => handleTabSwitch(index)}
                  />
                  <span 
                    style={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1
                    }}
                    onClick={() => handleTabSwitch(index)}
                  >
                    {tab.name}
                  </span>
                  <div
                    onClick={(e) => handleTabClose(index, e)}
                    style={{
                      flexShrink: 0,
                      borderRadius: '9999px',
                      padding: '2px',
                      transition: 'background-color 0.2s ease-in-out',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgb(229, 231, 235)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    title="닫기"
                  >
                    <X size={12} weight="bold" style={{ color: isActive ? 'white' : 'rgb(156, 163, 175)' }} />
                  </div>
                </div>
              );
            })}
            
            {/* New tab button */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: 'rgb(107, 114, 128)',
              transition: 'all 0.2s ease-in-out',
              cursor: 'pointer',
              marginLeft: '4px',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to right, rgb(168, 85, 247), rgb(59, 130, 246))';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(168, 85, 247, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = 'rgb(107, 114, 128)';
              e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
            }}
            >
              <Plus size={16} weight="bold" />
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        )}
      </header>

      {/* Main Content - Resizable Sidebar Layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {document && pdfProxy ? (
          <>
            {/* Left Sidebar - Thumbnails with Collapsible */}
            <div 
              style={{ 
                flexShrink: 0,
                width: isSidebarCollapsed ? '0px' : `${sidebarWidth}px`,
                borderRight: isSidebarCollapsed ? 'none' : '2px solid rgb(243, 232, 255)',
                background: 'linear-gradient(to bottom, rgba(250, 245, 255, 0.3), rgba(239, 246, 255, 0.3))',
                position: 'relative',
                transition: 'all 0.3s ease-in-out',
                pointerEvents: isSidebarCollapsed ? 'none' : 'auto',
              }}
            >
              {!isSidebarCollapsed && (
                <>
                  {/* Sidebar Content */}
                  <div style={{ 
                    height: '100%', 
                    overflow: 'hidden', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    pointerEvents: 'auto' 
                  }}>
                    {/* Collapse Button */}
                    <div style={{ 
                      flexShrink: 0, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      paddingLeft: '16px', 
                      paddingRight: '16px', 
                      paddingTop: '12px', 
                      paddingBottom: '12px', 
                      borderBottom: '2px solid rgb(243, 232, 255)',
                      background: 'linear-gradient(to right, rgb(250, 245, 255), rgb(239, 246, 255))'
                    }}>
                      <h3 style={{ 
                        fontSize: '14px', 
                        fontWeight: 'bold', 
                        background: 'linear-gradient(to right, rgb(147, 51, 234), rgb(37, 99, 235))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}>
                        페이지 미리보기
                      </h3>
                      <button
                        onClick={() => setIsSidebarCollapsed(true)}
                        style={{ 
                          padding: '6px', 
                          borderRadius: '8px', 
                          transition: 'background-color 0.2s ease-in-out',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgb(243, 232, 255)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        title="미리보기 접기"
                      >
                        <CaretLeft size={18} weight="bold" style={{ color: 'rgb(147, 51, 234)' }} />
                      </button>
                    </div>

                    {/* Thumbnail List */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <ThumbnailSidebar
                        pages={document.pages.filter(p => !p.deleted)}
                        allPages={document.pages}
                        currentPageId={currentPage?.id || null}
                        pdfProxy={pdfProxy}
                        onPageSelect={handlePageSelect}
                        onReorder={handlePageReorder}
                        onDuplicate={handlePageDuplicate}
                        onDelete={handlePageDelete}
                        onAddBlankPage={handleAddBlankPage}
                        onAddPdfPages={handleAddPdfPages}
                        sidebarWidth={sidebarWidth}
                        insertedPdfPages={insertedPdfPages}
                        insertedPdfProxies={insertedPdfProxies}
                      />
                  </div>
              </div>
                  
                </>
              )}

              {/* Enhanced Resizer Handle - Fixed position with inline styles */}
              {!isSidebarCollapsed && (
                <ResizerHandle 
                  sidebarWidth={sidebarWidth}
                  isResizing={isResizing}
                  onMouseDown={handleMouseDown}
                  headerHeight={tabs.length > 0 ? 95 : 48}
                />
              )}
                    </div>

            {/* Expand Button (when collapsed) - Same height as collapse button */}
            {isSidebarCollapsed && (
              <div style={{
                position: 'fixed',
                left: 0,
                top: 0,
                zIndex: 40,
                background: 'linear-gradient(to right, rgb(250, 245, 255), rgb(239, 246, 255))',
                borderBottom: '2px solid rgb(243, 232, 255)',
                height: '57px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <button
                  onClick={() => setIsSidebarCollapsed(false)}
                  style={{
                    height: '100%',
                    paddingLeft: '12px',
                    paddingRight: '12px',
                    transition: 'background-color 0.2s ease-in-out',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgb(243, 232, 255)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  title="미리보기 펼치기"
                >
                  <CaretRight size={20} weight="bold" style={{ color: 'rgb(147, 51, 234)' }} />
                </button>
                  </div>
            )}

            {/* Center - Modern Canvas Viewer - Soft gradient background */}
            <main style={{
              flex: 1,
              overflowY: 'auto',
              background: 'linear-gradient(to bottom right, rgba(250, 245, 255, 0.3), rgba(239, 246, 255, 0.2), rgb(248, 250, 252))',
              position: 'relative'
            }}>
              {/* Left Side Toolbar - Modern floating design */}
              <div 
                style={{
                  position: 'fixed',
                  top: '120px',
                  left: isSidebarCollapsed ? '16px' : `${sidebarWidth + 16}px`,
                  zIndex: 30,
                  transition: 'all 0.3s ease-in-out',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                {/* Annotation Tools - 플로팅 디자인 */}
                <AnnotationToolbox
                  activeTool={selection.activeTool}
                  onToolChange={setActiveTool}
                />
                
                {/* Style Panel */}
                {selection.selectedAnnotationIds.length > 0 && (
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(24px)',
                    borderRadius: '16px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    border: '1px solid rgba(216, 180, 254, 0.5)',
                    padding: '12px',
                    transition: 'box-shadow 0.2s ease-in-out',
                    marginTop: '16px'
                  }}>
                    <AnnotationStylePanel
                      selectedAnnotations={selection.selectedAnnotationIds.map(id => 
                        document?.pages.flatMap(p => p.layers.annotations).find(a => a.id === id)
                      ).filter(Boolean) || []}
                      onStyleChange={(style) => {
                        selection.selectedAnnotationIds.forEach(id => {
                          // Find the annotation to get its current state
                          const annotation = document?.pages
                            .flatMap(p => p.layers.annotations)
                            .find(a => a.id === id);
                          
                          if (annotation) {
                            // Create history patch for style change
                          const forward = [
                            { op: 'replace' as const, path: `/document/pages/${document.pages.findIndex(p => p.layers.annotations.some(a => a.id === id))}/layers/annotations/${document.pages.find(p => p.layers.annotations.some(a => a.id === id))?.layers.annotations.findIndex(a => a.id === id)}`, value: { ...annotation, style: { ...annotation.style, ...style } } }
                          ];
                          const backward = [
                            { op: 'replace' as const, path: `/document/pages/${document.pages.findIndex(p => p.layers.annotations.some(a => a.id === id))}/layers/annotations/${document.pages.find(p => p.layers.annotations.some(a => a.id === id))?.layers.annotations.findIndex(a => a.id === id)}`, value: annotation }
                          ];
                            
                            addHistoryPatch('주석 스타일 변경', forward, backward);
                          }
                          
                          updateAnnotation(id, { style: { ...style } });
                        });
                      }}
                    />
                </div>
                )}
                
              </div>

              {/* Multi-Page Canvas Area - Maximized for content */}
              <div style={{
                width: '100%',
                minHeight: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: '16px',
                paddingBottom: '12px',
                paddingLeft: '16px',
                paddingRight: '16px',
                gap: `${Math.max(32, 64 * view.zoom)}px` // Dynamic gap based on zoom
              }}>
                {document.pages.filter(p => !p.deleted).map((page) => {
                  const pageAnnotations = page.layers.annotations || [];
                  const isCurrentPage = page.id === currentPage?.id;

                  return (
                    <div 
                      id={`page-${page.id}`}
                      key={page.id}
                      style={{
                        position: 'relative',
                        transition: 'all 0.3s ease-in-out',
                        cursor: 'pointer',
                        transform: isCurrentPage ? 'scale(1.02)' : 'scale(1)'
                      }}
                      onClick={() => setCurrentPage(page.id)}
                      onMouseEnter={(e) => {
                        if (!isCurrentPage) {
                          e.currentTarget.style.transform = 'scale(1.005)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrentPage) {
                          e.currentTarget.style.transform = 'scale(1)';
                        }
                      }}
                    >

                      {/* Canvas Container - Modern card design */}
                      <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: isCurrentPage ? '1px solid rgb(216, 180, 254)' : '1px solid rgb(229, 231, 235)',
                        transition: 'all 0.5s ease-out',
                        boxShadow: isCurrentPage 
                          ? '0 20px 60px -15px rgba(168, 85, 247, 0.4), 0 0 0 4px rgba(168, 85, 247, 0.1)' 
                          : '0 10px 40px -15px rgba(0, 0, 0, 0.1)',
                        transform: isCurrentPage ? 'scale(1.01)' : 'scale(1)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrentPage) {
                          e.currentTarget.style.boxShadow = '0 20px 60px -15px rgba(168, 85, 247, 0.2)';
                          e.currentTarget.style.transform = 'scale(1.005)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrentPage) {
                          e.currentTarget.style.boxShadow = '0 10px 40px -15px rgba(0, 0, 0, 0.1)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }
                      }}
                      >
                        {(() => {
                          if (page.pdfRef && pdfProxy && !insertedPdfPages.has(page.id)) {
                            console.log('🔍 [Shell] Rendering original PDF page:', page.id);
                            return (
                              <PageView
                                pageId={page.id}
                                pageIndex={page.pdfRef.sourceIndex - 1}
                                pdfProxy={pdfProxy}
                                scale={view.zoom}
                                onRenderComplete={() => {
                                  // Recalculate zoom after page render for fit mode
                                  if (view.fitMode === 'page') {
                                    setTimeout(() => {
                                      calculateFitToPageZoom();
                                    }, 100);
                                  }
                                }}
                              />
                            );
                          } else if (page.pdfRef && insertedPdfPages.has(page.id)) {
                            const insertedPdfProxy = insertedPdfProxies.get(page.id);
                            if (insertedPdfProxy) {
                              console.log('🔍 [Shell] Rendering inserted PDF page with its own proxy:', page.id, 'pdfRef:', page.pdfRef);
                              return (
                                <PageView
                                  pageId={page.id}
                                  pageIndex={page.pdfRef.sourceIndex - 1}
                                  pdfProxy={insertedPdfProxy}
                                  scale={view.zoom}
                                  onRenderComplete={() => {
                                    // Recalculate zoom after page render for fit mode
                                    if (view.fitMode === 'page') {
                                      setTimeout(() => {
                                        calculateFitToPageZoom();
                                      }, 100);
                                    }
                                  }}
                                />
                              );
                            } else {
                              console.log('🔍 [Shell] No proxy found for inserted PDF page, showing placeholder:', page.id);
                              return (
                                <div style={{
                                  width: `${page.width * view.zoom}px`,
                                  height: `${page.height * view.zoom}px`,
                                  backgroundColor: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#9ca3af',
                                  fontSize: '18px',
                                  fontWeight: 500,
                                  border: '2px dashed #d1d5db',
                                  borderRadius: '8px'
                                }}>
                                  PDF 페이지
                </div>
                              );
                            }
                          } else {
                            console.log('🔍 [Shell] Rendering blank page:', page.id);
                            return (
                              <div style={{
                                width: `${page.width * view.zoom}px`,
                                height: `${page.height * view.zoom}px`,
                                backgroundColor: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#9ca3af',
                                fontSize: '18px',
                                fontWeight: 500
                              }}>
                                빈 페이지
              </div>
                            );
                          }
                        })()}
                        <AnnotationLayer
                          annotations={pageAnnotations}
                          pageId={page.id}
                          scale={view.zoom}
                          activeTool={selection.activeTool}
                          selectedAnnotationIds={selection.selectedAnnotationIds}
                          onSelect={(id) => {
                            if (id) {
                              selectAnnotations([id]);
                            } else {
                              selectAnnotations([]);
                            }
                          }}
                          onUpdate={(annotationId, updates) => {
                            // Find the annotation to get its current state
                            const annotation = document?.pages
                              .flatMap(p => p.layers.annotations)
                              .find(a => a.id === annotationId);
                            
                            if (annotation) {
                              // Create history patch for update
                              const forward = [
                                { op: 'replace' as const, path: `/document/pages/${document.pages.findIndex(p => p.layers.annotations.some(a => a.id === annotationId))}/layers/annotations/${document.pages.find(p => p.layers.annotations.some(a => a.id === annotationId))?.layers.annotations.findIndex(a => a.id === annotationId)}`, value: { ...annotation, ...updates } }
                              ];
                              const backward = [
                                { op: 'replace' as const, path: `/document/pages/${document.pages.findIndex(p => p.layers.annotations.some(a => a.id === annotationId))}/layers/annotations/${document.pages.find(p => p.layers.annotations.some(a => a.id === annotationId))?.layers.annotations.findIndex(a => a.id === annotationId)}`, value: annotation }
                              ];
                              
                              addHistoryPatch('주석 수정', forward, backward);
                            }
                            
                            updateAnnotation(annotationId, updates);
                          }}
                          onDelete={(annotationId) => {
                            // Find the annotation to get its current state
                            const annotation = document?.pages
                              .flatMap(p => p.layers.annotations)
                              .find(a => a.id === annotationId);
                            
                            if (annotation) {
                              const pageIndex = document.pages.findIndex(p => p.layers.annotations.some(a => a.id === annotationId));
                              const annotationIndex = document.pages[pageIndex].layers.annotations.findIndex(a => a.id === annotationId);
                              
                              // Create history patch for deletion
                              const forward = [
                                { op: 'remove' as const, path: `/document/pages/${pageIndex}/layers/annotations/${annotationIndex}` }
                              ];
                              const backward = [
                                { op: 'add' as const, path: `/document/pages/${pageIndex}/layers/annotations/${annotationIndex}`, value: annotation }
                              ];
                              
                              addHistoryPatch('주석 삭제', forward, backward);
                            }
                            
                            removeAnnotation(annotationId);
                          }}
                          onCreate={(annotation: Annotation) => {
                            console.log('✅ [Shell] Creating annotation:', annotation);
                            
                            // Add to history
                            const forward = [
                              { op: 'add' as const, path: `/document/pages/${document.pages.findIndex(p => p.id === annotation.pageId)}/layers/annotations/-`, value: annotation }
                            ];
                            const backward = [
                              { op: 'remove' as const, path: `/document/pages/${document.pages.findIndex(p => p.id === annotation.pageId)}/layers/annotations/${document.pages.find(p => p.id === annotation.pageId)?.layers.annotations.length || 0}` }
                            ];
                            
                            addHistoryPatch('주석 추가', forward, backward);
                            addAnnotation(annotation);
                            selectAnnotations([annotation.id]);
                          }}
                          onPan={(deltaX, deltaY) => {
                            // TODO: Implement view panning
                            console.log('Pan:', deltaX, deltaY);
                          }}
                        />
              </div>
                    </div>
                  );
                })}
                  </div>

              {/* Zoom Control integrated in Toolbar */}
              {/* Moved to toolbar */}

              {/* Floating Page Navigator - Premium floating design */}
              <div 
                style={{ 
                  position: 'fixed',
                  top: tabs.length > 0 ? '4rem' : '3.5rem',
                  left: `calc(50% + ${(isSidebarCollapsed ? 0 : sidebarWidth) / 2}px)`,
                  transform: 'translateX(-50%)',
                  zIndex: 50,
                  transition: 'all 0.3s ease-in-out',
                  pointerEvents: 'auto'
                }}
              >
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(24px)',
                  borderRadius: '16px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  border: '1px solid rgba(216, 180, 254, 0.5)',
                  padding: '12px',
                  transition: 'box-shadow 0.2s ease-in-out'
                }}>
                  <PageNavigator
                    currentPage={currentPageIndex}
                    totalPages={document.pages.filter(p => !p.deleted).length}
                    onPageChange={handlePageChange}
                  />
                </div>
              </div>
            </main>
          </>
        ) : (
          /* Empty State - Inline Styles */
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
              {isLoading ? (
                <>
                  <div style={{ position: 'relative', marginBottom: '24px' }}>
                    <div style={{ width: '80px', height: '80px', marginLeft: 'auto', marginRight: 'auto' }}>
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        border: '4px solid rgb(191, 219, 254)',
                        borderRadius: '9999px',
                        animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite'
                      }} />
                      <div style={{
                        position: 'relative',
                        width: '80px',
                        height: '80px',
                        border: '4px solid rgb(59, 130, 246)',
                        borderTopColor: 'transparent',
                        borderRadius: '9999px',
                        animation: 'spin 1s linear infinite'
                      }} />
                    </div>
                  </div>
                  <p style={{ fontSize: '18px', fontWeight: '600', color: 'rgb(31, 41, 55)', marginBottom: '8px' }}>PDF 로딩 중...</p>
                  <p style={{ fontSize: '14px', color: 'rgb(107, 114, 128)' }}>잠시만 기다려주세요</p>
                </>
              ) : error ? (
                <>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    marginBottom: '24px',
                    backgroundColor: 'rgb(254, 226, 226)',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '36px' }}>⚠️</span>
                  </div>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'rgb(31, 41, 55)', marginBottom: '8px' }}>오류 발생</h2>
                  <p style={{ color: 'rgb(75, 85, 99)', marginBottom: '24px' }}>{error}</p>
                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    paddingLeft: '24px',
                    paddingRight: '24px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(37, 99, 235))',
                    color: 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, rgb(37, 99, 235), rgb(29, 78, 216))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, rgb(59, 130, 246), rgb(37, 99, 235))';
                  }}
                  >
                    <FileArrowUp size={24} weight="duotone" />
                    <span>다시 시도</span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                  </label>
                </>
              ) : (
                <>
                  <div style={{
                    width: '128px',
                    height: '128px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    marginBottom: '32px',
                    background: 'linear-gradient(to bottom right, rgb(239, 246, 255), rgb(219, 234, 254))',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                  }}>
                    <FileArrowUp size={64} weight="duotone" style={{ color: 'rgb(59, 130, 246)' }} />
                  </div>
                  <h2 style={{ fontSize: '30px', fontWeight: 'bold', color: 'rgb(31, 41, 55)', marginBottom: '12px' }}>PDF 편집 시작하기</h2>
                  <p style={{ color: 'rgb(75, 85, 99)', marginBottom: '32px', lineHeight: '1.625' }}>
                    PDF 파일을 업로드하여 편집을 시작하세요.
                    <br />
                    텍스트, 주석, 그리기 등 다양한 기능을 사용할 수 있습니다.
                  </p>
                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingLeft: '32px',
                    paddingRight: '32px',
                    paddingTop: '16px',
                    paddingBottom: '16px',
                    background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(37, 99, 235))',
                    color: 'white',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)',
                    fontSize: '18px',
                    fontWeight: '600'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, rgb(37, 99, 235), rgb(29, 78, 216))';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, rgb(59, 130, 246), rgb(37, 99, 235))';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(59, 130, 246, 0.3)';
                  }}
                  >
                    <FileArrowUp size={28} weight="duotone" />
                    <span>PDF 파일 열기</span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <div style={{
                    marginTop: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '24px',
                    fontSize: '14px',
                    color: 'rgb(107, 114, 128)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'rgb(34, 197, 94)' }}>✓</span>
                      <span>로컬 처리</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'rgb(34, 197, 94)' }}>✓</span>
                      <span>데이터 안전</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'rgb(34, 197, 94)' }}>✓</span>
                      <span>빠른 편집</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Zoom Controls - 우측 하단 */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(24px)',
        borderRadius: '12px',
        boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid rgba(216, 180, 254, 0.5)',
        padding: '8px',
        transition: 'box-shadow 0.2s ease-in-out'
      }}>
        <ZoomControl
          zoom={view.zoom}
          fitMode={view.fitMode}
          onZoomChange={setZoom}
          onFitMode={fitView}
        />
      </div>

      {/* Export Modal */}
      {exportModalOpen && document && pdfProxy && (
        <ExportPanel
          document={document}
          pdfProxy={pdfProxy}
          currentPageIndex={currentPageIndex}
          onClose={() => setExportModalOpen(false)}
          insertedPdfProxies={insertedPdfProxies}
        />
      )}
    </div>
  );
}
