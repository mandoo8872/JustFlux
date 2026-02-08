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
  pages: Page[]; // PageStore의 pages 추가
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
  document: _document, // 사용하지 않는 변수
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
      <div style={{
        position: 'fixed',
        left: 0,
        top: '40px', // Header 높이만
        zIndex: 30,
        backgroundColor: '#F5F5F5',
        borderRight: '1px solid #D0D0D0',
        width: '24px',
        height: 'calc(100vh - 40px)',
        display: 'flex',
        alignItems: 'flex-start',
        paddingTop: '8px'
      }}>
        <button
          onClick={onToggleSidebar}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '20px',
            height: '20px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#333333',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease-in-out'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#E0E0E0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="사이드바 열기"
        >
          <span style={{ fontSize: '14px' }}>▶</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: '40px', // Header 높이만
      width: `${sidebarWidth}px`,
      height: 'calc(100vh - 40px)', // Header 높이만 제외
      backgroundColor: '#F5F5F5',
      borderRight: '1px solid #D0D0D0',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 30
    }}>
      {/* Sidebar Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '32px',
        paddingLeft: '8px',
        paddingRight: '8px',
        borderBottom: '1px solid #D0D0D0',
        backgroundColor: '#FFFFFF'
      }}>
        <span style={{ fontSize: '12px', fontWeight: 500, color: '#333333' }}>페이지</span>
        <button
          onClick={onToggleSidebar}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '20px',
            height: '20px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#333333',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease-in-out'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#E0E0E0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="사이드바 닫기"
        >
          <span style={{ fontSize: '12px' }}>◀</span>
        </button>
      </div>

      {/* Thumbnail List */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <ThumbnailSidebar
          pages={pages} // PageStore의 pages 사용
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
