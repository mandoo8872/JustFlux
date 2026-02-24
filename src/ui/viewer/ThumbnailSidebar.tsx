/**
 * ThumbnailSidebar Component - 페이지 썸네일 목록
 *
 * 실제 렌더링은 ThumbnailList 컴포넌트가 담당.
 * 이 컴포넌트는 Context Menu와 PDF 파일 삽입을 관리하는 오케스트레이터.
 */

import { useState, useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { Page } from '../../core/model/types';
import { PageContextMenu } from './PageContextMenu';
import { ThumbnailList } from './thumbnails/ThumbnailList';

interface ThumbnailSidebarProps {
  pages: Page[];
  allPages: Page[];
  currentPageId: string | null;
  pdfProxy: PDFDocumentProxy;
  onPageSelect: (pageId: string) => void;
  onReorder: (pageIds: string[]) => void;
  onDuplicate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  onAddBlankPage: (afterPageId: string, width: number, height: number) => void;
  onAddPdfPages: (afterPageId: string, file: File) => void;
  sidebarWidth: number;
  insertedPdfPages?: Set<string>;
  insertedPdfProxies?: Map<string, PDFDocumentProxy>;
}

export function ThumbnailSidebar({
  pages,
  currentPageId,
  pdfProxy,
  onPageSelect,
  onReorder,
  onDuplicate,
  onDelete,
  onAddBlankPage,
  onAddPdfPages,
  sidebarWidth,
}: ThumbnailSidebarProps) {
  const [contextMenu, setContextMenu] = useState<{ pageId: string; x: number; y: number } | null>(null);
  const pdfFileInputRef = useRef<HTMLInputElement>(null);
  const contextMenuPageIdRef = useRef<string | null>(null);

  const handleAddPdfPage = (afterPageId: string) => {
    contextMenuPageIdRef.current = afterPageId;
    pdfFileInputRef.current?.click();
  };

  const handlePdfFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && contextMenuPageIdRef.current) {
      onAddPdfPages(contextMenuPageIdRef.current, file);
    }
    e.target.value = '';
    contextMenuPageIdRef.current = null;
  };

  return (
    <>
      <ThumbnailList
        pages={pages}
        currentPageId={currentPageId}
        pdfProxy={pdfProxy}
        onPageSelect={onPageSelect}
        onReorder={onReorder}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onAddBlankPage={onAddBlankPage}
        onAddPdfPages={onAddPdfPages}
        sidebarWidth={sidebarWidth}
      />

      {/* Hidden file input for PDF insertion */}
      <input
        ref={pdfFileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        style={{ display: 'none' }}
        onChange={handlePdfFileSelect}
      />

      {/* Context Menu */}
      {contextMenu && (
        <PageContextMenu
          pageId={contextMenu.pageId}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onAddBlankPage={(pageId) => {
            const page = pages.find(p => p.id === pageId);
            if (page) onAddBlankPage(pageId, page.width, page.height);
          }}
          onAddPdfPage={handleAddPdfPage}
          onRotateRight={() => { }}
          onRotateLeft={() => { }}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
