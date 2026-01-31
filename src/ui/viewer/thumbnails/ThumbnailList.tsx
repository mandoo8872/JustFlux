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

  // 빈 페이지 추가 핸들러 (세로 A4)
  const handleAddPortraitPage = useCallback(() => {
    const lastPage = pages[pages.length - 1];
    const afterPageId = lastPage?.id || '';
    onAddBlankPage(afterPageId, 595, 842); // A4 세로: 595×842pt
  }, [pages, onAddBlankPage]);

  // 빈 페이지 추가 핸들러 (가로 A4)
  const handleAddLandscapePage = useCallback(() => {
    const lastPage = pages[pages.length - 1];
    const afterPageId = lastPage?.id || '';
    onAddBlankPage(afterPageId, 842, 595); // A4 가로: 842×595pt
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

      {/* 빈 페이지 추가 - 세로/가로 선택 */}
      <div
        style={{
          width: '100%',
          marginTop: pages.length > 0 ? '8px' : '0px', // 페이지 있으면 8px 간격, 없으면 바로 위에
          border: '2px dashed #9ca3af',
          borderRadius: '12px',
          padding: '12px',
          backgroundColor: '#f9fafb',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <span style={{
          fontSize: '12px',
          color: '#6b7280',
          fontWeight: 500
        }}>
          빈 페이지 추가
        </span>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          {/* 세로 A4 버튼 */}
          <div
            onClick={handleAddPortraitPage}
            style={{
              width: '48px',
              height: '68px', // A4 세로 비율 (210:297)
              border: '2px solid #d1d5db',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backgroundColor: '#ffffff',
              transition: 'all 0.15s ease-in-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#6366f1';
              e.currentTarget.style.backgroundColor = '#eef2ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
            title="세로 A4 페이지 추가"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </div>
          {/* 가로 A4 버튼 */}
          <div
            onClick={handleAddLandscapePage}
            style={{
              width: '68px',
              height: '48px', // A4 가로 비율 (297:210)
              border: '2px solid #d1d5db',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backgroundColor: '#ffffff',
              transition: 'all 0.15s ease-in-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#6366f1';
              e.currentTarget.style.backgroundColor = '#eef2ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
            title="가로 A4 페이지 추가"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

