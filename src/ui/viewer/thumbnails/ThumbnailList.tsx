/**
 * ThumbnailList - 확장 가능한 썸네일 목록 시스템
 * 가상화 및 성능 최적화 고려
 */

import React, { useCallback, useMemo } from 'react';
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

  // 빈 페이지 추가 핸들러 (마지막 페이지 크기 참조 — 페이지가 있을 때)
  const handleAddBlankPageFromLast = useCallback(() => {
    const lastPage = pages[pages.length - 1];
    if (!lastPage) return;
    onAddBlankPage(lastPage.id, lastPage.width, lastPage.height);
  }, [pages, onAddBlankPage]);

  // 빈 페이지 추가 핸들러 (세로 A4 — 페이지가 없을 때)
  const handleAddPortraitPage = useCallback(() => {
    const lastPage = pages[pages.length - 1];
    const afterPageId = lastPage?.id || '';
    onAddBlankPage(afterPageId, 595, 842); // A4 세로: 595×842pt
  }, [pages, onAddBlankPage]);

  // 빈 페이지 추가 핸들러 (가로 A4 — 페이지가 없을 때)
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

  // 공통 버튼 스타일
  const addButtonStyle = (w: string, h: string): React.CSSProperties => ({
    width: w,
    height: h,
    border: '2px solid #d1d5db',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: '#ffffff',
    transition: 'all 0.15s ease-in-out',
  });

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderColor = '#6366f1';
    e.currentTarget.style.backgroundColor = '#eef2ff';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderColor = '#d1d5db';
    e.currentTarget.style.backgroundColor = '#ffffff';
  };

  const plusIcon = (size: number) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );

  return (
    <div
      style={{
        width: sidebarWidth - 20,
        padding: '10px',
        paddingBottom: '20px'
      }}
    >
      <ThumbnailDragDrop
        onReorder={onReorder}
        pages={pages}
      >
        {renderThumbnailItems()}
      </ThumbnailDragDrop>

      {/* 빈 페이지 추가 */}
      <div
        style={{
          width: '100%',
          marginTop: pages.length > 0 ? '8px' : '0px',
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
          {pages.length > 0 ? (
            /* 페이지가 있을 때: 마지막 페이지 크기 참조하는 단일 버튼 */
            <div
              onClick={handleAddBlankPageFromLast}
              style={addButtonStyle('60px', '60px')}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              title={`빈 페이지 추가 (${Math.round(pages[pages.length - 1].width)}×${Math.round(pages[pages.length - 1].height)})`}
            >
              {plusIcon(22)}
            </div>
          ) : (
            /* 페이지가 없을 때: A4 세로/가로 선택 */
            <>
              <div
                onClick={handleAddPortraitPage}
                style={addButtonStyle('48px', '68px')}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                title="세로 A4 페이지 추가"
              >
                {plusIcon(18)}
              </div>
              <div
                onClick={handleAddLandscapePage}
                style={addButtonStyle('68px', '48px')}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                title="가로 A4 페이지 추가"
              >
                {plusIcon(18)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
