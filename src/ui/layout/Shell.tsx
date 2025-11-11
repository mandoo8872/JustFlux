/**
 * Main application shell layout - REFACTORED
 * 깔끔하게 분리된 컴포넌트 구조
 */

import { useCallback, useState, useEffect } from 'react';
import {
  useDocumentStore,
} from '../../state/documentStore';
import { useViewStore } from '../../state/stores/ViewStore';
import { useAnnotationStore } from '../../state/stores/AnnotationStore';
import { useHistoryStore } from '../../state/stores/HistoryStore';
import { usePageStore } from '../../state/stores/PageStore';
import { usePDFStore } from '../../state/stores/PDFStore';
// import { loadPdfFile } from '../../core/pdf/pdfLoader'; // FileService로 대체
import { createPage } from '../../core/model/factories';
import { Header } from './Header';
import { useEventBus } from '../../core/events/useEventBus';
import { initializeContainer } from '../../core/di/ContainerSetup';
import { Sidebar } from './Sidebar';
import { RightSidebar } from './RightSidebar';
import { MainContent } from './MainContent';
import { ExportPanel } from '../export/ExportPanel';
import type { PDFDocumentProxy } from 'pdfjs-dist';


export function Shell() {
  // DI Container 초기화
  useEffect(() => {
    initializeContainer();
  }, []);

  // 이벤트 시스템 사용
  const { emit: _emit } = useEventBus();

  // Document Store
  const {
    document,
  } = useDocumentStore();

  const { undo, redo, addHistoryPatch } = useHistoryStore();

  const {
    selection,
    updateAnnotation,
    removeAnnotation,
    selectAnnotations,
    addAnnotationToPage,
    setActiveTool,
  } = useAnnotationStore();

  const { view, setScale, fitToPage, setViewportSize } = useViewStore();

  // 뷰포트 크기 설정
  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize(window.innerWidth, window.innerHeight);
    };
    
    updateViewportSize();
    window.addEventListener('resize', updateViewportSize);
    
    return () => {
      window.removeEventListener('resize', updateViewportSize);
    };
  }, [setViewportSize]);

  const canUndo = false; // HistoryStore에서 가져오도록 수정
  const canRedo = false; // HistoryStore에서 가져오도록 수정
  
  // PageStore와 PDFStore에서 실제 상태 가져오기
  const { pages, currentPageId, setCurrentPage } = usePageStore();
  const { pdfProxy } = usePDFStore();
  const currentPage = pages.find(p => p.id === currentPageId) || null;
  const currentPageIndex = pages.findIndex(p => p.id === currentPageId);
  
  // 디버깅 로그
  console.log(`🔍 [Shell] Pages: ${pages.length}, CurrentPageId: ${currentPageId}, CurrentPageIndex: ${currentPageIndex}`);
  if (currentPage) {
    console.log(`🔍 [Shell] CurrentPage: id=${currentPage.id}, index=${currentPage.index}`);
  }

  // UI State
  const [sidebarWidth] = useState(280);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [rightSidebarWidth] = useState(60);
  // 오른쪽 사이드바는 항상 표시 (접기 기능 제거)
  const [isRightSidebarCollapsed] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [insertedPdfPages] = useState<Set<string>>(new Set());
  const [insertedPdfProxies] = useState<Map<string, PDFDocumentProxy>>(new Map());

  // File Selection Handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // FileService를 통한 파일 로딩
        const { FileService } = await import('../../core/services/FileService');
        
        if (file.type === 'application/pdf') {
          await FileService.loadPdfFile(file);
        } else if (file.type.startsWith('image/')) {
          await FileService.loadImageFile(file);
        }
        
        // Clear file input
        e.target.value = '';
      } catch (error) {
        console.error('Failed to load file:', error);
        useDocumentStore.setState({
          error: error instanceof Error ? error.message : 'Failed to load file',
          isLoading: false,
        });
      }
    }
  };

  // Page Handlers
  const handlePageReorder = useCallback((pageIds: string[]) => {
    const { reorderPages } = usePageStore.getState();
    reorderPages(pageIds);
  }, []);

  const handlePageDuplicate = useCallback((pageId: string) => {
    const { duplicatePage } = usePageStore.getState();
    duplicatePage(pageId);
  }, []);

  const handlePageDelete = useCallback((pageId: string) => {
    const { removePage } = usePageStore.getState();
    removePage(pageId);
  }, []);

  const handleAddBlankPage = useCallback((afterPageId: string, width: number, height: number) => {
    const { pages, addPage, getPageIndex, getPage } = usePageStore.getState();
    const afterPage = getPage(afterPageId);
    const afterIndex = getPageIndex(afterPageId);
    
    if (!afterPage) {
      console.warn('Cannot find page to add after:', afterPageId);
      return;
    }
    
    const newPage = createPage({
      docId: afterPage.docId,
      index: afterIndex + 1,
      width,
      height
    });
    
    // Insert at correct position
    if (afterIndex !== -1 && afterIndex < pages.length - 1) {
      const { insertPdfPages } = usePageStore.getState();
      insertPdfPages(afterPageId, [newPage]);
    } else {
      addPage(newPage);
    }
  }, []);

  const handleAddPdfPages = useCallback(async (afterPageId: string, file: File) => {
    try {
      const { FileService } = await import('../../core/services/FileService');
      await FileService.loadPdfFile(file);
      
      // PDF 페이지들을 afterPageId 뒤에 삽입하는 로직은 FileService에서 처리해야 함
      // 현재는 기본 PDF 로딩만 수행
      console.log('PDF pages added after:', afterPageId);
    } catch (error) {
      console.error('Failed to add PDF pages:', error);
    }
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      width: '100vw',
      backgroundColor: '#E5E5E5',
      overflow: 'hidden' // 전체 레이아웃 스크롤 방지
    }}>
      {/* Header */}
      <Header
        document={document}
        totalPages={pages.length}
        canUndo={canUndo}
        canRedo={canRedo}
        onFileSelect={handleFileSelect}
        onUndo={undo}
        onRedo={redo}
        onExport={() => setExportModalOpen(true)}
      />

      {/* Left Sidebar */}
      <Sidebar
        document={document}
        currentPage={currentPage}
        pdfProxy={pdfProxy}
        pages={pages}
        sidebarWidth={sidebarWidth}
        isSidebarCollapsed={isSidebarCollapsed}
        onPageSelect={setCurrentPage}
        onPageReorder={handlePageReorder}
        onPageDuplicate={handlePageDuplicate}
        onPageDelete={handlePageDelete}
        onAddBlankPage={handleAddBlankPage}
        onAddPdfPages={handleAddPdfPages}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        insertedPdfPages={insertedPdfPages}
        insertedPdfProxies={insertedPdfProxies}
      />

      {/* Right Sidebar */}
      <RightSidebar
        activeTool={selection.activeTool}
        onToolChange={setActiveTool}
        zoom={view.scale}
        onZoomChange={setScale}
        onFitView={() => {
          if (currentPage) {
            fitToPage(currentPage.width, currentPage.height);
          }
        }}
        currentPageIndex={currentPageIndex}
        totalPages={pages.length}
        onPageChange={async (index) => {
          const { pages } = (await import('../../state/stores/PageStore')).usePageStore.getState();
          const page = pages[index];
          if (page) setCurrentPage(page.id);
        }}
        sidebarWidth={rightSidebarWidth}
        isCollapsed={isRightSidebarCollapsed}
        onToggle={() => {}}
      />

      {/* Main Content */}
      <MainContent
        document={document}
        pages={pages}
        currentPage={currentPage}
        pdfProxy={pdfProxy}
        view={{ zoom: view.scale, pan: { x: view.panX, y: view.panY }, fitMode: 'page' as const }}
        selection={selection}
        sidebarWidth={sidebarWidth}
        isSidebarCollapsed={isSidebarCollapsed}
        rightSidebarWidth={rightSidebarWidth}
        isRightSidebarCollapsed={isRightSidebarCollapsed}
        onPageSelect={setCurrentPage}
        onZoomChange={setScale}
        onPanChange={() => {}}
        onAddAnnotation={(annotation) => {
          if (currentPage) {
            const annotationWithId = {
              ...annotation,
              id: `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              ...(annotation.type === 'stamp' && { stampType: 'approved' })
            };
            addAnnotationToPage(currentPage.id, annotationWithId as any);
          }
        }}
        onUpdateAnnotation={updateAnnotation}
        onDeleteAnnotation={removeAnnotation}
        onSelectAnnotations={selectAnnotations}
        onAddHistoryPatch={addHistoryPatch}
      />

      {/* Export Modal */}
      {exportModalOpen && document && pdfProxy && (
        <ExportPanel
          document={document}
          pdfProxy={pdfProxy}
          currentPageIndex={currentPageIndex}
          onClose={() => setExportModalOpen(false)}
          insertedPdfProxies={insertedPdfProxies as any}
        />
      )}
    </div>
  );
}

