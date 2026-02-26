/**
 * Shell — 메인 애플리케이션 셸 (Refactored)
 *
 * 역할: 순수한 레이아웃 조합 + 상태 연결 (Orchestrator)
 *  - 주석 CRUD        → useAnnotationActions
 *  - 페이지 관리       → usePageActions
 *  - 클립보드 붙여넣기 → useClipboardPaste
 *  - 키보드 단축키     → useKeyboardShortcuts
 *  - 파일 드래그&드롭  → useFileDrop
 */

import { useState, useEffect, useRef } from 'react';
import { useDocumentStore } from '../../state/documentStore';
import { useViewStore } from '../../state/stores/ViewStore';
import { useAnnotationStore } from '../../state/stores/AnnotationStore';
import { useHistoryStore } from '../../state/stores/HistoryStore';
import { usePageStore } from '../../state/stores/PageStore';
import { usePDFStore } from '../../state/stores/PDFStore';
import { initializeContainer } from '../../core/di/ContainerSetup';

// ── 레이아웃 컴포넌트 ──
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { RightSidebar } from './RightSidebar';
import { MainContent } from './MainContent';
import { ExportPanel } from '../export/ExportPanel';
import { FileDropDialog } from '../dialogs/FileDropDialog';

// ── 커스텀 훅 ──
import { useClipboardPaste } from '../hooks/useClipboardPaste';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useFileDrop } from '../hooks/useFileDrop';
import { useAnnotationActions } from '../hooks/useAnnotationActions';
import { usePageActions } from '../hooks/usePageActions';

import type { PDFDocumentProxy } from 'pdfjs-dist';

// ── 레이아웃 상수 ──
const SIDEBAR_WIDTH = 280;
const RIGHT_SIDEBAR_WIDTH = 60;

export function Shell() {
  // ── 초기화 ──
  useEffect(() => { initializeContainer(); }, []);

  // ── 훅 기반 기능 ──
  useClipboardPaste();
  useKeyboardShortcuts();

  const [insertedPdfPages] = useState<Set<string>>(new Set());
  const [insertedPdfProxies] = useState<Map<string, PDFDocumentProxy>>(new Map());

  const fileDrop = useFileDrop(insertedPdfProxies);

  // ── 스토어 상태 ──
  const { document } = useDocumentStore();
  const { undo, redo, canUndo, canRedo } = useHistoryStore();
  const { selection, updateAnnotation, selectAnnotations, setActiveTool } = useAnnotationStore();
  const { view, setScale, fitToPage, setViewportSize, smoothRendering, toggleSmoothRendering } = useViewStore();
  const { pages, currentPageId, setCurrentPage } = usePageStore();
  const { pdfProxy } = usePDFStore();

  const currentPage = pages.find(p => p.id === currentPageId) || null;
  const currentPageIndex = pages.findIndex(p => p.id === currentPageId);

  // ── 추출된 훅 ──
  const { handleAddAnnotation, handleDeleteAnnotation } = useAnnotationActions({
    currentPageId: currentPage?.id ?? null,
  });

  const {
    handlePageReorder, handlePageDuplicate, handlePageDelete,
    handleAddBlankPage, handleAddPdfPages,
  } = usePageActions({ documentId: document?.id ?? null });

  // ── UI State ──
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // ── 뷰포트 크기 동기화 + 창맞춤 ──
  const doFitToPage = useRef(() => { });
  doFitToPage.current = () => {
    const collapsed = isSidebarCollapsed;
    const leftW = collapsed ? 0 : SIDEBAR_WIDTH;
    const rightW = RIGHT_SIDEBAR_WIDTH;
    const headerH = 40; // Header height
    const contentW = window.innerWidth - leftW - rightW;
    const contentH = window.innerHeight - headerH;
    setViewportSize(contentW, contentH);
    const cp = usePageStore.getState().pages.find(
      p => p.id === usePageStore.getState().currentPageId
    );
    if (cp) fitToPage(cp.width, cp.height);
  };

  useEffect(() => {
    const update = () => doFitToPage.current();
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // 사이드바 접힘/펼침 시 재계산
  useEffect(() => {
    // 사이드바 transition(0.3s) 완료 후 재계산
    const timer = setTimeout(() => doFitToPage.current(), 320);
    return () => clearTimeout(timer);
  }, [isSidebarCollapsed]);

  // ── Render ──
  return (
    <div
      onDragOver={fileDrop.handleDragOver}
      onDragLeave={fileDrop.handleDragLeave}
      onDrop={fileDrop.handleDrop}
      style={{
        display: 'flex', flexDirection: 'column',
        height: '100vh', width: '100vw',
        backgroundColor: '#E5E5E5', overflow: 'hidden', position: 'relative',
      }}
    >
      <Header
        document={document}
        totalPages={pages.length}
        canUndo={canUndo}
        canRedo={canRedo}
        smoothRendering={smoothRendering}
        onFileSelect={fileDrop.handleFileSelect}
        onUndo={undo}
        onRedo={redo}
        onExport={() => setExportModalOpen(true)}
        onToggleSmooth={toggleSmoothRendering}
      />

      <Sidebar
        document={document}
        currentPage={currentPage}
        pdfProxy={pdfProxy}
        pages={pages}
        sidebarWidth={SIDEBAR_WIDTH}
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

      <RightSidebar
        activeTool={selection.activeTool}
        onToolChange={setActiveTool}
        zoom={view.scale}
        onZoomChange={setScale}
        onFitView={() => {
          if (currentPage) fitToPage(currentPage.width, currentPage.height);
        }}
        currentPageIndex={currentPageIndex}
        totalPages={pages.length}
        onPageChange={async (index) => {
          const { pages } = usePageStore.getState();
          const page = pages[index];
          if (page) setCurrentPage(page.id);
        }}
        sidebarWidth={RIGHT_SIDEBAR_WIDTH}
        isCollapsed={false}
        onToggle={() => { }}
      />

      <MainContent
        document={document}
        pages={pages}
        currentPage={currentPage}
        pdfProxy={pdfProxy}
        insertedPdfProxies={insertedPdfProxies}
        view={{ zoom: view.scale, pan: { x: view.panX, y: view.panY }, fitMode: 'page' as const }}
        selection={selection}
        sidebarWidth={SIDEBAR_WIDTH}
        isSidebarCollapsed={isSidebarCollapsed}
        rightSidebarWidth={RIGHT_SIDEBAR_WIDTH}
        isRightSidebarCollapsed={false}
        onPageSelect={setCurrentPage}
        onZoomChange={setScale}
        onPanChange={() => { }}
        onAddAnnotation={handleAddAnnotation}
        onUpdateAnnotation={updateAnnotation}
        onDeleteAnnotation={handleDeleteAnnotation}
        onSelectAnnotations={selectAnnotations}
        onAddHistoryPatch={useHistoryStore.getState().addHistoryPatch}
      />

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

      {/* File Drop Dialog */}
      {fileDrop.showDropDialog && fileDrop.pendingDropFile && (
        <FileDropDialog
          fileName={fileDrop.pendingDropFile.name}
          onReplace={fileDrop.handleDropReplace}
          onAppend={fileDrop.handleDropAppend}
          onCancel={fileDrop.handleDropCancel}
        />
      )}

      {/* Drag Overlay */}
      {fileDrop.isDragOver && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 120, 212, 0.08)',
          border: '3px dashed #0078D4', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9998, pointerEvents: 'none',
        }}>
          <div style={{
            padding: '20px 40px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          }}>
            <p style={{ fontSize: '16px', fontWeight: 500, color: '#0078D4', margin: 0 }}>
              파일을 여기에 놓으세요
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
