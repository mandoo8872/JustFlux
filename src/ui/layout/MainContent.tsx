/**
 * MainContent Component - 메인 콘텐츠 영역
 *
 * 제스처 핸들링은 커스텀 훅으로 추출됨:
 *  - useWheelZoom: 마우스 휠 줌
 *  - usePinchZoom: 터치 핀치 줌
 */

import { useRef } from 'react';
import { PageViewer } from './PageViewer';
import { useAnnotationStore } from '../../state/stores/AnnotationStore';
import { useWheelZoom } from '../hooks/useWheelZoom';
import { usePinchZoom } from '../hooks/usePinchZoom';
import type { Document as JFDocument, Page, Annotation, SelectionState } from '../../core/model/types';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface MainContentProps {
  document: JFDocument | null;
  pages: Page[];
  currentPage: Page | null;
  pdfProxy: PDFDocumentProxy | null;
  insertedPdfProxies?: Map<string, PDFDocumentProxy>;
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
  onSelectAnnotations?: (ids: string[]) => void;
}

export function MainContent({
  document,
  pages,
  currentPage,
  pdfProxy,
  insertedPdfProxies,
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
}: MainContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { clearSelection } = useAnnotationStore();

  // ── 제스처 훅 ──
  const { handleWheel } = useWheelZoom({ zoom: view.zoom, onZoomChange });
  usePinchZoom({ zoom: view.zoom, onZoomChange, containerRef: containerRef as React.RefObject<HTMLDivElement> });

  return (
    <div
      ref={containerRef}
      className="canvas-area"
      style={{
        left: isSidebarCollapsed ? '0' : `${sidebarWidth}px`,
        right: isRightSidebarCollapsed ? '0' : `${rightSidebarWidth}px`,
      }}
      onWheel={handleWheel}
      onClick={(e) => {
        if (e.target === e.currentTarget) clearSelection();
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        minHeight: '100%',
        padding: '8px 16px',
      }}>
        <PageViewer
          document={document}
          pages={pages}
          currentPage={currentPage}
          pdfProxy={pdfProxy}
          insertedPdfProxies={insertedPdfProxies}
          scale={view.zoom}
          pan={view.pan}
          activeTool={selection.activeTool}
          onPanChange={onPanChange}
          onAddAnnotation={onAddAnnotation}
          onUpdateAnnotation={onUpdateAnnotation}
          onDeleteAnnotation={onDeleteAnnotation}
          onPageSelect={onPageSelect}
          scrollContainerRef={containerRef as React.RefObject<HTMLDivElement>}
        />
      </div>
    </div>
  );
}
