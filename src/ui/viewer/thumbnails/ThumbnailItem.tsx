/**
 * ThumbnailItem - 개별 썸네일 아이템
 * 확장 가능한 썸네일 시스템
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Page } from '../../../core/model/types';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PageContextMenu } from '../PageContextMenu';
import { usePageStore } from '../../../state/stores/PageStore';
import { usePDFStore } from '../../../state/stores/PDFStore';
import { useTranslation } from '../../../i18n';

interface ThumbnailItemProps {
  page: Page;
  isSelected: boolean;
  pdfProxy: PDFDocumentProxy | null;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddBlankPage: (width: number, height: number) => void;
  onAddPdfPages: (file: File) => void;
}

export function ThumbnailItem({
  page,
  isSelected,
  pdfProxy,
  onSelect,
  onDuplicate,
  onDelete,
  onAddBlankPage,
  onAddPdfPages
}: ThumbnailItemProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const itemRef = useRef<HTMLDivElement>(null);
  const updatePage = usePageStore(state => state.updatePage);
  const globalRotation = usePDFStore(state => state.globalRotation);
  const { t } = useTranslation();

  const handleRotateRight = useCallback(() => {
    const newRotation = ((page.rotation + 90) % 360) as 0 | 90 | 180 | 270;
    // Swap width and height on 90/270 rotation changes
    updatePage(page.id, {
      rotation: newRotation,
      width: page.height,
      height: page.width,
    });
  }, [page.id, page.rotation, page.width, page.height, updatePage]);

  const handleRotateLeft = useCallback(() => {
    const newRotation = ((page.rotation + 270) % 360) as 0 | 90 | 180 | 270;
    updatePage(page.id, {
      rotation: newRotation,
      width: page.height,
      height: page.width,
    });
  }, [page.id, page.rotation, page.width, page.height, updatePage]);

  // 썸네일 생성
  useEffect(() => {
    const generateThumbnailAsync = async () => {
      try {
        setIsLoading(true);

        if (pdfProxy && page.pdfRef) {
          // PDF 페이지 렌더링 (page.pdfRef.sourceIndex 사용)
          const pdfPage = await pdfProxy.getPage(page.pdfRef.sourceIndex);
          const viewport = pdfPage.getViewport({ scale: 0.2, rotation: globalRotation });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          if (context) {
            await pdfPage.render({
              canvasContext: context,
              viewport: viewport,
              canvas: canvas
            }).promise;

            const thumbnailData = canvas.toDataURL('image/png');
            setThumbnail(thumbnailData);
          }
        } else {
          setThumbnail(null);
        }
      } catch (error) {
        console.error('Failed to generate thumbnail:', error);
        setThumbnail(null);
      } finally {
        setIsLoading(false);
      }
    };

    generateThumbnailAsync();
  }, [page.id, page.pdfRef, pdfProxy, globalRotation]);

  // 컨텍스트 메뉴 처리
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setShowContextMenu(true);
  }, []);

  // 컨텍스트 메뉴 닫기
  const handleCloseContextMenu = useCallback(() => {
    setShowContextMenu(false);
  }, []);

  // 빈 페이지 추가
  const handleAddBlankPage = useCallback(() => {
    onAddBlankPage(page.width, page.height);
    handleCloseContextMenu();
  }, [onAddBlankPage, page.width, page.height, handleCloseContextMenu]);

  // PDF 페이지 추가
  const handleAddPdfPages = useCallback((file: File) => {
    onAddPdfPages(file);
    handleCloseContextMenu();
  }, [onAddPdfPages, handleCloseContextMenu]);

  return (
    <>
      <div
        ref={itemRef}
        style={{
          width: '100%',
          height: 120,
          marginBottom: 10,
          border: isSelected ? '2px solid #007bff' : '1px solid #ddd',
          borderRadius: 8,
          cursor: 'pointer',
          position: 'relative',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
        onClick={onSelect}
        onContextMenu={handleContextMenu}
      >
        {isLoading ? (
          <div style={{ color: '#666' }}>{t('sidebar.loading')}</div>
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt={`Page ${page.index + 1}`}
            draggable={false}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        ) : (
          <div style={{ color: '#666', textAlign: 'center' }}>
            <div>{t('sidebar.pageLabel')} {page.index + 1}</div>
            <div style={{ fontSize: '12px', marginTop: 4 }}>
              {page.width} × {page.height}
            </div>
          </div>
        )}

        {/* 선택 표시 */}
        {isSelected && (
          <div
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 20,
              height: 20,
              backgroundColor: '#007bff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            ✓
          </div>
        )}
      </div>

      {/* 컨텍스트 메뉴 */}
      {showContextMenu && (
        <PageContextMenu
          position={contextMenuPosition}
          pageId={page.id}
          onClose={handleCloseContextMenu}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onAddBlankPage={handleAddBlankPage}
          onAddPdfPage={(_afterPageId: string) => {
            const file = new File([''], 'temp.pdf', { type: 'application/pdf' });
            handleAddPdfPages(file);
          }}
          onRotateRight={() => handleRotateRight()}
          onRotateLeft={() => handleRotateLeft()}
        />
      )}
    </>
  );
}
