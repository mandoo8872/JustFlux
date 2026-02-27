/**
 * Sidebar Component - 좌측 사이드바
 */

import { ThumbnailSidebar } from '../viewer/ThumbnailSidebar';
import { useTranslation } from '../../i18n';
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
  const { t } = useTranslation();

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
          title={t('sidebar.open')}
          aria-label={t('sidebar.open')}
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
      <div className="sidebar-header">
        <span className="sidebar-header__title">{t('sidebar.pages')}</span>
        <button
          className="btn-icon"
          onClick={onToggleSidebar}
          style={{ width: '20px', height: '20px' }}
          title={t('sidebar.close')}
          aria-label={t('sidebar.close')}
        >
          <span style={{ fontSize: '12px' }}>◀</span>
        </button>
      </div>

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
