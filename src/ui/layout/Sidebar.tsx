/**
 * Sidebar Component - 좌측 사이드바
 * 썸네일 목록, 도구박스, 스타일 패널 등을 포함
 */

import { ThumbnailSidebar } from '../viewer/ThumbnailSidebar';
import type { Document as JFDocument, Page } from '../../core/model/types';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface SidebarProps {
  document: JFDocument | null;
  currentPage: Page | null;
  pdfProxy: PDFDocumentProxy | null;
  pages: Page[];
  sidebarWidth: number;
  isSidebarCollapsed: boolean;
  onPageSelect: (pageId: string) => void;
  onPageReorder: (pageIds: string[]) => void;
  onPageDuplicate: (pageId: string) => void;
  onPageDelete: (pageId: string) => void;
  onAddBlankPage: (afterPageId: string, width: number, height: number) => void;
  onAddPdfPages: (afterPageId: string, file: File) => void;
  onToggleSidebar: () => void;
  insertedPdfPages: Set<string>;
  insertedPdfProxies: Map<string, PDFDocumentProxy>;
}

export function Sidebar({
  document: _document,
  currentPage,
  pdfProxy,
  pages,
  sidebarWidth,
  isSidebarCollapsed,
  onPageSelect,
  onPageReorder,
  onPageDuplicate,
  onPageDelete,
  onAddBlankPage,
  onAddPdfPages,
  onToggleSidebar,
  insertedPdfPages,
  insertedPdfProxies,
}: SidebarProps) {
  if (isSidebarCollapsed) {
    return (
      <div
        className="sidebar-panel sidebar-panel--left"
        style={{ width: 'var(--sidebar-collapsed-width)' }}
      >
        <button
          className="btn-icon"
          onClick={onToggleSidebar}
          style={{ width: '20px', height: '20px', marginTop: 'var(--space-2)' }}
          title="사이드바 열기"
          aria-label="사이드바 열기"
        >
          <span style={{ fontSize: '14px' }}>▶</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="sidebar-panel sidebar-panel--left"
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <span className="sidebar-header__title">페이지</span>
        <button
          className="btn-icon"
          onClick={onToggleSidebar}
          style={{ width: '20px', height: '20px' }}
          title="사이드바 닫기"
          aria-label="사이드바 닫기"
        >
          <span style={{ fontSize: '12px' }}>◀</span>
        </button>
      </div>

      {/* Thumbnail List */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <ThumbnailSidebar
          pages={pages}
          allPages={pages}
          currentPageId={currentPage?.id || null}
          pdfProxy={pdfProxy!}
          onPageSelect={onPageSelect}
          onReorder={onPageReorder}
          onDuplicate={onPageDuplicate}
          onDelete={onPageDelete}
          onAddBlankPage={onAddBlankPage}
          onAddPdfPages={onAddPdfPages}
          sidebarWidth={sidebarWidth}
          insertedPdfPages={insertedPdfPages}
          insertedPdfProxies={insertedPdfProxies}
        />
      </div>
    </div>
  );
}
