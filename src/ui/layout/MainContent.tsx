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
  onAddAnnotation: (annotation: Omit<Annotation, 'id'>) => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  onSelectAnnotations: (ids: string[]) => void;
  onAddHistoryPatch: (description: string, forward: any[], backward: any[]) => void;
}

export function MainContent({
  document,
  pages,
  currentPage,
  pdfProxy,
  view,
  selection,
  sidebarWidth,
  isSidebarCollapsed,
  rightSidebarWidth,
  isRightSidebarCollapsed,
  onPageSelect,
  onZoomChange,
  onPanChange,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
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

  // 현재 줌 값을 ref로 관리하여 최신 값 사용
  const zoomRef = useRef(view.zoom);
  useEffect(() => {
    zoomRef.current = view.zoom;
  }, [view.zoom]);

  // 전역 휠 이벤트 리스너 (브라우저 확대/축소 방지)
  useEffect(() => {
    // 브라우저 환경이 아닌 경우 (테스트 등) 스킵
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const handleGlobalWheel = (e: WheelEvent) => {
      // Ctrl+휠 또는 Meta+휠 조합에서 브라우저 확대/축소 방지
      if (e.ctrlKey || e.metaKey) {
        // 즉시 preventDefault 호출하여 브라우저 기본 동작 차단
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // 앱 내부 줌 변경 (ref를 사용하여 최신 값 사용)
        const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
        const currentZoom = zoomRef.current;
        const newZoom = Math.max(0.1, Math.min(5.0, currentZoom + zoomDelta));
        onZoomChange(newZoom);
        
        return false;
      }
    };

    // 리스너 등록 상태 추적
    let listenersRegistered = false;

    // 다음 틱에 실행하여 DOM이 완전히 준비된 후 등록
    const timeoutId = setTimeout(() => {
      try {
        // capture phase에서 이벤트를 먼저 캐치하여 브라우저 기본 동작 방지
        window.addEventListener('wheel', handleGlobalWheel, { passive: false, capture: true });
        try {
          const doc = globalThis.document;
          if (doc) {
            doc.addEventListener('wheel', handleGlobalWheel, { passive: false, capture: true });
            if (doc.body) {
              doc.body.addEventListener('wheel', handleGlobalWheel, { passive: false, capture: true });
            }
          }
        } catch (e) {
          // document가 없는 환경에서는 무시
        }
        listenersRegistered = true;
        console.log('✅ [MainContent] Wheel listeners registered');
      } catch (error) {
        console.warn('Failed to register wheel listeners:', error);
      }
    }, 0);
    
    return () => {
      clearTimeout(timeoutId);
      
      if (!listenersRegistered) {
        return;
      }

      try {
        window.removeEventListener('wheel', handleGlobalWheel, { capture: true });
        try {
          const doc = globalThis.document;
          if (doc) {
            doc.removeEventListener('wheel', handleGlobalWheel, { capture: true });
            if (doc.body) {
              doc.body.removeEventListener('wheel', handleGlobalWheel, { capture: true });
            }
          }
        } catch (e) {
          // document가 없는 환경에서는 무시
        }
      } catch (error) {
        console.warn('Failed to remove wheel listeners:', error);
      }
    };
  }, [onZoomChange]);

  // 터치 이벤트 핸들러 (핀치 줌 방지)
  useEffect(() => {
    // 브라우저 환경이 아닌 경우 (테스트 등) 스킵
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    let initialDistance = 0;
    let initialZoom = zoomRef.current; // ref 사용
    let isPinching = false;

    const handleTouchStart = (e: TouchEvent) => {
      // 두 손가락 터치 감지 시 즉시 차단
      if (e.touches.length === 2) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        isPinching = true;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        initialZoom = zoomRef.current; // ref에서 최신 값 가져오기
      } else {
        isPinching = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // 핀치 제스처 중이거나 두 손가락 터치가 감지되면 무조건 차단
      if (e.touches.length === 2) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        if (isPinching && initialDistance > 0) {
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
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        isPinching = false;
        initialDistance = 0;
      }
    };

    // 리스너 등록 상태 추적
    let listenersRegistered = false;

    // 다음 틱에 실행하여 DOM이 완전히 준비된 후 등록
    const timeoutId = setTimeout(() => {
      try {
        // 최상위 레벨에서 처리하여 브라우저 기본 동작 완전 차단
        // capture phase에서 먼저 처리하여 다른 리스너보다 우선순위 높임
        window.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: false, capture: true });
        window.addEventListener('touchcancel', handleTouchEnd, { passive: false, capture: true });
        
        try {
          const doc = globalThis.document;
          if (doc) {
            doc.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
            doc.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
            doc.addEventListener('touchend', handleTouchEnd, { passive: false, capture: true });
            doc.addEventListener('touchcancel', handleTouchEnd, { passive: false, capture: true });
          }
        } catch (e) {
          // document가 없는 환경에서는 무시
        }
        
        const container = containerRef.current;
        if (container && typeof container.addEventListener === 'function') {
          container.addEventListener('touchstart', handleTouchStart, { passive: false });
          container.addEventListener('touchmove', handleTouchMove, { passive: false });
          container.addEventListener('touchend', handleTouchEnd, { passive: false });
          container.addEventListener('touchcancel', handleTouchEnd, { passive: false });
        }
        listenersRegistered = true;
        console.log('✅ [MainContent] Touch listeners registered');
      } catch (error) {
        console.warn('Failed to register touch listeners:', error);
      }
    }, 0);
    
    return () => {
      clearTimeout(timeoutId);
      
      if (!listenersRegistered) {
        return;
      }

      try {
        window.removeEventListener('touchstart', handleTouchStart, { capture: true });
        window.removeEventListener('touchmove', handleTouchMove, { capture: true });
        window.removeEventListener('touchend', handleTouchEnd, { capture: true });
        window.removeEventListener('touchcancel', handleTouchEnd, { capture: true });
        
        try {
          const doc = globalThis.document;
          if (doc) {
            doc.removeEventListener('touchstart', handleTouchStart, { capture: true });
            doc.removeEventListener('touchmove', handleTouchMove, { capture: true });
            doc.removeEventListener('touchend', handleTouchEnd, { capture: true });
            doc.removeEventListener('touchcancel', handleTouchEnd, { capture: true });
          }
        } catch (e) {
          // document가 없는 환경에서는 무시
        }
        
        const container = containerRef.current;
        if (container && typeof container.removeEventListener === 'function') {
          container.removeEventListener('touchstart', handleTouchStart);
          container.removeEventListener('touchmove', handleTouchMove);
          container.removeEventListener('touchend', handleTouchEnd);
          container.removeEventListener('touchcancel', handleTouchEnd);
        }
      } catch (error) {
        console.warn('Failed to remove touch listeners:', error);
      }
    };
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
        overflowX: 'hidden', // 가로 스크롤 방지
        touchAction: 'pan-y pan-x', // 세로/가로 스크롤만 허용, 핀치 줌 차단
        WebkitTouchCallout: 'none'
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
          scrollContainerRef={containerRef as React.RefObject<HTMLDivElement>}
        />
      </div>
    </div>
  );
}
