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
import { createPage, createImageAnnotation } from '../../core/model/factories';
import { Header } from './Header';
import { useEventBus } from '../../core/events/useEventBus';
import { initializeContainer } from '../../core/di/ContainerSetup';
import { Sidebar } from './Sidebar';
import { RightSidebar } from './RightSidebar';
import { MainContent } from './MainContent';
import { ExportPanel } from '../export/ExportPanel';
import { FileDropDialog } from '../dialogs/FileDropDialog';
import type { PDFDocumentProxy } from 'pdfjs-dist';


export function Shell() {
  // DI Container 초기화
  useEffect(() => {
    initializeContainer();


  }, []);

  // Clipboard Paste Handler
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // 텍스트 입력 중이면 무시 (contentEditable 등)
      if (
        window.document.activeElement?.tagName === 'INPUT' ||
        window.document.activeElement?.tagName === 'TEXTAREA' ||
        (window.document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (!e.clipboardData || !e.clipboardData.items) return;

      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (!blob) continue;

          // 현재 페이지 ID 찾기 (Shell의 currentPage는 렌더링 시점 값이라 여기서 직접 조회)
          // 하지만 여기선 currentPage가 prop이나 state로 없으므로, selection 상태 활용
          const { selection } = useAnnotationStore.getState();
          // 만약 selectedPageId가 없다면 첫 페이지 또는 현재 뷰포트 페이지를 가정해야 함
          // Shell 컴포넌트 내부 스테이트인 currentPage를 의존하기 어려우므로 store에서 가져옴

          let targetPageId = selection.selectedPageId;
          const { pages } = usePageStore.getState();

          if (!targetPageId && pages.length > 0) {
            targetPageId = pages[0].id;
          }

          if (targetPageId) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                const imageUrl = event.target.result as string;

                // 이미지 크기를 알기 위해 로드
                const img = new Image();
                img.onload = () => {
                  const width = Math.min(img.width, 500); // 최대 500px 제한
                  const height = width * (img.height / img.width);

                  const newAnnotation = createImageAnnotation({
                    pageId: targetPageId!,
                    bbox: {
                      x: 100, // 임시 위치
                      y: 100,
                      width,
                      height
                    },
                    imageData: imageUrl,
                    originalWidth: img.width,
                    originalHeight: img.height
                  });

                  console.log('📋 [Clipboard] Pasting image annotation:', newAnnotation);
                  useAnnotationStore.getState().addAnnotationToPage(targetPageId!, newAnnotation);
                  useAnnotationStore.getState().setActiveTool('select');
                  setTimeout(() => {
                    useAnnotationStore.getState().selectAnnotation(newAnnotation.id);
                  }, 50);
                };
                img.src = imageUrl;
              }
            };
            reader.readAsDataURL(blob);
          }

          // 이벤트 전파 중단 (이미지 붙여넣기 성공 시)
          e.preventDefault();
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
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
    selectAnnotation,
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

  // 전역 Ctrl+V 키보드 이벤트 처리 (클립보드 붙여넣기)
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // 텍스트 입력 필드에서는 기본 동작 유지
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Ctrl+D 또는 Cmd+D: 선택된 객체 복제
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        const { selection, cloneAnnotation } = useAnnotationStore.getState();
        const selectedId = selection.selectedAnnotationIds[0];
        if (selectedId) {
          cloneAnnotation(selectedId);
          console.log('📋 [Shell] Ctrl+D: Duplicated annotation:', selectedId);
        }
        return;
      }

      // Ctrl+V 또는 Cmd+V 감지
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        // 텍스트 입력 필드에서는 기본 동작 유지
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }

        e.preventDefault();
        console.log('📋 [Shell] Ctrl+V detected, pasting from clipboard');

        try {
          const { ClipboardService } = await import('../../core/services/ClipboardService');
          const success = await ClipboardService.pasteFromClipboard();
          if (success) {
            console.log('📋 [Shell] Paste successful');
          } else {
            console.log('📋 [Shell] Nothing to paste');
          }
        } catch (error) {
          console.error('📋 [Shell] Paste failed:', error);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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

  // 드래그&드롭 상태
  const [isDragOver, setIsDragOver] = useState(false);
  const [pendingDropFile, setPendingDropFile] = useState<File | null>(null);
  const [showDropDialog, setShowDropDialog] = useState(false);

  // 파일 로딩 공용 함수 (교체 모드)
  const loadFileAsReplace = async (file: File) => {
    try {
      const { FileService } = await import('../../core/services/FileService');
      const ext = file.name.toLowerCase().split('.').pop();

      if (file.type === 'application/pdf') {
        await FileService.loadPdfFile(file);
      } else if (file.type.startsWith('image/')) {
        await FileService.loadImageFile(file);
      } else if (ext === 'md' || ext === 'txt' || file.type === 'text/plain' || file.type === 'text/markdown') {
        await FileService.loadTextFile(file);
      } else {
        console.warn('Unsupported file type:', file.type, ext);
      }
    } catch (error) {
      console.error('Failed to load file:', error);
      useDocumentStore.setState({
        error: error instanceof Error ? error.message : 'Failed to load file',
        isLoading: false,
      });
    }
  };

  // 파일 추가 (append) 함수
  const loadFileAsAppend = async (file: File, matchWidth: boolean) => {
    try {
      const { FileService } = await import('../../core/services/FileService');

      if (file.type === 'application/pdf') {
        const proxy = await FileService.appendPdfFile(file, matchWidth);
        if (proxy) {
          insertedPdfProxies.set(file.name, proxy);
        }
      } else if (file.type.startsWith('image/')) {
        await FileService.appendImageFile(file, matchWidth);
      } else {
        console.warn('Unsupported file type for append:', file.type);
      }
    } catch (error) {
      console.error('Failed to append file:', error);
    }
  };

  // File Selection Handler (기존 input[type=file])
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 기존 문서가 있으면 다이얼로그, 없으면 바로 열기
      if (pages.length > 0) {
        setPendingDropFile(file);
        setShowDropDialog(true);
      } else {
        await loadFileAsReplace(file);
      }
      e.target.value = '';
    }
  };

  // 드래그&드롭 핸들러
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // relatedTarget이 자식이면 무시 (bubbling 방지)
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    const { FileService } = await import('../../core/services/FileService');
    if (!FileService.validateFileType(file)) {
      console.warn('Unsupported file type:', file.type);
      return;
    }

    // 기존 페이지가 있으면 다이얼로그 표시
    const { pages: currentPages } = usePageStore.getState();
    if (currentPages.length > 0) {
      setPendingDropFile(file);
      setShowDropDialog(true);
    } else {
      await loadFileAsReplace(file);
    }
  }, []);

  // 다이얼로그 핸들러
  const handleDropReplace = useCallback(async () => {
    if (pendingDropFile) {
      setShowDropDialog(false);
      await loadFileAsReplace(pendingDropFile);
      setPendingDropFile(null);
    }
  }, [pendingDropFile]);

  const handleDropAppend = useCallback(async (matchWidth: boolean) => {
    if (pendingDropFile) {
      setShowDropDialog(false);
      await loadFileAsAppend(pendingDropFile, matchWidth);
      setPendingDropFile(null);
    }
  }, [pendingDropFile]);

  const handleDropCancel = useCallback(() => {
    setShowDropDialog(false);
    setPendingDropFile(null);
  }, []);

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
    const { pages, addPage, getPageIndex, getPage, setCurrentPage: setCurrentPageInStore } = usePageStore.getState();

    // 페이지가 없거나 afterPageId가 빈 문자열인 경우 첫 페이지로 추가
    if (!afterPageId || pages.length === 0) {
      const newPage = createPage({
        docId: document?.id || 'new-doc',
        index: 0,
        width,
        height,
        contentType: 'blank'
      });
      addPage(newPage);
      setCurrentPageInStore(newPage.id);
      return;
    }

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
      height,
      contentType: 'blank'
    });

    // Insert at correct position
    if (afterIndex !== -1 && afterIndex < pages.length - 1) {
      const { insertPdfPages } = usePageStore.getState();
      insertPdfPages(afterPageId, [newPage]);
    } else {
      addPage(newPage);
    }
    setCurrentPageInStore(newPage.id);
  }, [document]);

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
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#E5E5E5',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
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
        onToggle={() => { }}
      />

      {/* Main Content */}
      <MainContent
        document={document}
        pages={pages}
        currentPage={currentPage}
        pdfProxy={pdfProxy}
        insertedPdfProxies={insertedPdfProxies}
        view={{ zoom: view.scale, pan: { x: view.panX, y: view.panY }, fitMode: 'page' as const }}
        selection={selection}
        sidebarWidth={sidebarWidth}
        isSidebarCollapsed={isSidebarCollapsed}
        rightSidebarWidth={rightSidebarWidth}
        isRightSidebarCollapsed={isRightSidebarCollapsed}
        onPageSelect={setCurrentPage}
        onZoomChange={setScale}
        onPanChange={() => { }}
        onAddAnnotation={(annotation) => {
          console.log('🔔 [Shell] onAddAnnotation called, currentPage:', currentPage?.id, 'annotation:', annotation);
          if (currentPage) {
            // 기존 ID가 있으면 사용, 없으면 새로 생성
            const annotationId = (annotation as any).id || `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const annotationWithId = {
              ...annotation,
              id: annotationId,
              ...(annotation.type === 'stamp' && { stampType: 'approved' })
            };
            console.log('🔔 [Shell] Calling addAnnotationToPage with:', currentPage.id, annotationWithId);
            addAnnotationToPage(currentPage.id, annotationWithId as any);

            // UX 개선: 생성 후 자동으로 선택 도구로 전환하고 생성된 객체 선택
            setActiveTool('select');

            // 약간의 지연 후 선택 (상태 업데이트 보장)
            setTimeout(() => {
              console.log('🔔 [Shell] Auto-selecting new annotation:', annotationId);
              selectAnnotation(annotationId);
            }, 50);
          } else {
            console.warn('⚠️ [Shell] currentPage is null, cannot add annotation');
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

      {/* File Drop Dialog */}
      {showDropDialog && pendingDropFile && (
        <FileDropDialog
          fileName={pendingDropFile.name}
          onReplace={handleDropReplace}
          onAppend={handleDropAppend}
          onCancel={handleDropCancel}
        />
      )}

      {/* Drag Overlay */}
      {isDragOver && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 120, 212, 0.08)',
          border: '3px dashed #0078D4',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9998,
          pointerEvents: 'none',
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

