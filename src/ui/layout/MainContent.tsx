/**
 * MainContent Component - 메인 콘텐츠 영역
 * 페이지 뷰어, 주석 레이어, 팬/줌 로직 등을 포함
 */

import { useCallback, useEffect, useRef } from 'react';
import { PageViewer } from './PageViewer';
import type { Document as JFDocument, Page, Annotation, SelectionState } from '../../core/model/types';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface MainContentProps {
  document: JFDocument | null;
  pages: Page[]; // PageStore의 pages 추가
  currentPage: Page | null;
  pdfProxy: PDFDocumentProxy | null;
  currentPageIndex: number;
  totalPages: number; // totalPages prop 추가
  view: {
    zoom: number;
    pan: { x: number; y: number };
    fitMode: 'page' | 'width' | 'height' | 'actual';
  };
  selection: SelectionState;
  sidebarWidth: number;
  isSidebarCollapsed: boolean;
  rightSidebarWidth: number;
  isRightSidebarCollapsed: boolean;
  onPageSelect: (pageId: string) => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
  onZoomChange: (zoom: number) => void;
  onPanChange: (pan: { x: number; y: number }) => void;
  onFitView: (mode: 'page' | 'width' | 'height' | 'actual') => void;
  onSetActiveTool: (tool: string) => void;
  onAddAnnotation: (annotation: Omit<Annotation, 'id'>) => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  onSelectAnnotations: (ids: string[]) => void;
  onUpdateAnnotationStyle: (style: any) => void;
  onAddHistoryPatch: (description: string, forward: any[], backward: any[]) => void;
}

export function MainContent({
  document,
  pages,
  currentPage,
  pdfProxy,
  currentPageIndex,
  totalPages,
  view,
  selection,
  sidebarWidth,
  isSidebarCollapsed,
  rightSidebarWidth,
  isRightSidebarCollapsed,
  onPageSelect,
  onZoomChange,
  onPanChange,
  onFitView,
  onSetActiveTool,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onUpdateAnnotationStyle,
  onAddHistoryPatch,
}: MainContentProps) {
  // Empty state is handled by PageViewer

  const containerRef = useRef<HTMLDivElement>(null);

  // 드래그 앤 드롭 핸들러
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      try {
        const { FileService } = await import('../../core/services/FileService');
        if (file.type === 'application/pdf') {
          await FileService.loadPdfFile(file);
        } else if (file.type.startsWith('image/')) {
          await FileService.loadImageFile(file);
        }
      } catch (error) {
        console.error('Failed to load file via drag and drop:', error);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // 휠 이벤트 핸들러 (Ctrl+휠 또는 핀치 줌 방지)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Ctrl+휠 또는 핀치 줌 방지
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      
      // 줌 변경
      const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.1, Math.min(5.0, view.zoom + zoomDelta));
      onZoomChange(newZoom);
    }
  }, [view.zoom, onZoomChange]);

  // 전역 휠 이벤트 리스너 (핀치 줌 방지)
  useEffect(() => {
    const handleGlobalWheel = (e: WheelEvent) => {
      // Ctrl+휠 또는 핀치 줌 방지
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        
        if (containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          const mouseX = e.clientX - containerRect.left;
          const mouseY = e.clientY - containerRect.top;
          
          // 줌 변경
          const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
          const newZoom = Math.max(0.1, Math.min(5.0, view.zoom + zoomDelta));
          onZoomChange(newZoom);
        }
      }
    };

    window.addEventListener('wheel', handleGlobalWheel, { passive: false });
    
    return () => {
      window.removeEventListener('wheel', handleGlobalWheel);
    };
  }, [view.zoom, onZoomChange]);

  // 터치 이벤트 핸들러 (핀치 줌 방지)
  useEffect(() => {
    let initialDistance = 0;
    let initialZoom = view.zoom;
    let isPinching = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        e.stopPropagation();
        isPinching = true;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        initialZoom = view.zoom;
      } else {
        isPinching = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && isPinching) {
        e.preventDefault();
        e.stopPropagation();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        
        const scale = currentDistance / initialDistance;
        const newZoom = Math.max(0.1, Math.min(5.0, initialZoom * scale));
        onZoomChange(newZoom);
      }
    };

    const handleTouchEnd = () => {
      isPinching = false;
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: false });
      container.addEventListener('touchcancel', handleTouchEnd, { passive: false });
      
      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
        container.removeEventListener('touchcancel', handleTouchEnd);
      };
    }
  }, [view.zoom, onZoomChange]);

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'fixed',
        top: '40px', // Header 높이만
        left: isSidebarCollapsed ? '0' : `${sidebarWidth}px`,
        right: isRightSidebarCollapsed ? '0' : `${rightSidebarWidth}px`,
        bottom: 0,
        transition: 'left 0.3s ease-in-out, right 0.3s ease-in-out',
        backgroundColor: '#E5E5E5', // Adobe PDF Reader 스타일 회색 배경
        overflow: 'auto',
        overflowX: 'hidden' // 가로 스크롤 방지
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onWheel={handleWheel}
    >
      {/* Page Viewer Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        minHeight: '100%',
        padding: '8px 16px',
        paddingTop: '8px',
        paddingBottom: '8px'
      }}>
        <PageViewer
          document={document}
          pages={pages}
          currentPage={currentPage}
          pdfProxy={pdfProxy}
          scale={view.zoom}
          pan={view.pan}
          activeTool={selection.activeTool}
          onPanChange={onPanChange}
          onAddAnnotation={onAddAnnotation}
          onUpdateAnnotation={onUpdateAnnotation}
          onDeleteAnnotation={onDeleteAnnotation}
          onAddHistoryPatch={onAddHistoryPatch}
          onPageSelect={onPageSelect}
          scrollContainerRef={containerRef}
        />
      </div>
    </div>
  );
}
