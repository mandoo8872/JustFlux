/**
 * ThumbnailList - 확장 가능한 썸네일 목록 시스템
 * 가상화 및 성능 최적화 고려
 */

import { useCallback, useMemo } from 'react';
import type { Page } from '../../../core/model/types';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { ThumbnailItem } from './ThumbnailItem';
import { ThumbnailDragDrop } from './ThumbnailDragDrop';

interface ThumbnailListProps {
  pages: Page[];
  currentPageId: string | null;
  pdfProxy: PDFDocumentProxy | null;
  onPageSelect: (pageId: string) => void;
  onReorder: (pageIds: string[]) => void;
  onDuplicate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  onAddBlankPage: (afterPageId: string, width: number, height: number) => void;
  onAddPdfPages: (afterPageId: string, file: File) => void;
  sidebarWidth: number;
}

export function ThumbnailList({
  pages,
  currentPageId,
  pdfProxy,
  onPageSelect,
  onReorder,
  onDuplicate,
  onDelete,
  onAddBlankPage,
  onAddPdfPages,
  sidebarWidth
}: ThumbnailListProps) {

  // 모든 페이지를 렌더링 (스크롤 가능하도록)
  // 가상화는 나중에 필요시 구현
  const visiblePages = useMemo(() => {
    return pages;
  }, [pages]);

  // 빈 페이지 추가 핸들러
  const handleAddBlankPage = useCallback(() => {
    // 마지막 페이지 뒤에 추가, 또는 첫 페이지로 추가
    const lastPage = pages[pages.length - 1];
    const width = lastPage?.width || 595; // A4 width
    const height = lastPage?.height || 842; // A4 height
    const afterPageId = lastPage?.id || '';
    onAddBlankPage(afterPageId, width, height);
  }, [pages, onAddBlankPage]);

  // 썸네일 아이템 렌더링
  const renderThumbnailItems = useCallback(() => {
    return visiblePages.map((page) => (
      <ThumbnailItem
        key={page.id}
        page={page}
        isSelected={page.id === currentPageId}
        pdfProxy={pdfProxy}
        onSelect={() => onPageSelect(page.id)}
        onDuplicate={() => onDuplicate(page.id)}
        onDelete={() => onDelete(page.id)}
        onAddBlankPage={(width, height) => onAddBlankPage(page.id, width, height)}
        onAddPdfPages={(file) => onAddPdfPages(page.id, file)}
      />
    ));
  }, [visiblePages, currentPageId, pdfProxy, onPageSelect, onDuplicate, onDelete, onAddBlankPage, onAddPdfPages]);

  return (
    <div
      style={{
        width: sidebarWidth - 20,
        height: 'calc(100vh - 48px - 80px)', // 헤더(48px) + BottomControls(80px) 제외
        overflowY: 'auto',
        padding: '10px',
        paddingBottom: '20px' // 하단 여백 추가
      }}
    >
      <ThumbnailDragDrop
        onReorder={onReorder}
        pages={pages}
      >
        {renderThumbnailItems()}
      </ThumbnailDragDrop>

      {/* 빈 페이지 추가 버튼 */}
      <div
        onClick={handleAddBlankPage}
        style={{
          width: '100%',
          aspectRatio: '210 / 297', // A4 비율
          marginTop: '16px',
          border: '2px dashed #9ca3af',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
          backgroundColor: '#f9fafb',
          transition: 'all 0.2s ease-in-out',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#6366f1';
          e.currentTarget.style.backgroundColor = '#eef2ff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#9ca3af';
          e.currentTarget.style.backgroundColor = '#f9fafb';
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </div>
        <span style={{
          fontSize: '13px',
          color: '#6b7280',
          fontWeight: 500
        }}>
          빈 페이지 추가
        </span>
      </div>
    </div>
  );
}

