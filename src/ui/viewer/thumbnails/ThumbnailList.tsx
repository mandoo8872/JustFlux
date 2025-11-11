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

  // 썸네일 아이템 렌더링
  const renderThumbnailItems = useCallback(() => {
    return visiblePages.map((page, index) => (
      <ThumbnailItem
        key={page.id}
        page={page}
        index={index}
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
    </div>
  );
}
