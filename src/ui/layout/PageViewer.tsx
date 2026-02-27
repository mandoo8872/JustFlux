/**
 * PageViewer Component - 페이지 뷰어
 * 현재 페이지 중심으로 이전/다음 페이지도 렌더링하고, 가장 많이 보이는 페이지를 자동 감지
 *
 * 추출된 모듈:
 *  - usePageScrollTracking: IntersectionObserver + 스크롤 기반 페이지 감지 + 프로그래매틱 스크롤
 *  - PageContentRenderer: 페이지 contentType별 렌더링
 */

import { useRef } from 'react';
import { AnnotationManager } from '../../domains/annotations';
import type { Document as JFDocument, Page, Annotation, ToolType } from '../../core/model/types';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { usePageScrollTracking } from '../hooks/usePageScrollTracking';
import { PageContentRenderer } from './PageContentRenderer';
import { useTranslation } from '../../i18n';

interface PageViewerProps {
  document: JFDocument | null;
  pages: Page[];
  currentPage: Page | null;
  pdfProxy: PDFDocumentProxy | null;
  insertedPdfProxies?: Map<string, PDFDocumentProxy>;
  scale: number;
  pan: { x: number; y: number };
  activeTool: string;
  onPanChange: (pan: { x: number; y: number }) => void;
  onAddAnnotation: (annotation: Omit<Annotation, 'id'>) => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  onAddHistoryPatch: (description: string, forward: any[], backward: any[]) => void;
  onPageSelect: (pageId: string) => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

export function PageViewer({
  document,
  pages,
  currentPage,
  pdfProxy,
  insertedPdfProxies,
  scale,
  activeTool,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onAddHistoryPatch,
  onPageSelect,
  scrollContainerRef,
}: PageViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { t } = useTranslation();

  const { registerPageRef } = usePageScrollTracking({
    hasDocument: !!document,
    currentPageId: currentPage?.id ?? null,
    onPageSelect,
    scrollContainerRef,
  });

  // Empty state
  if (!currentPage || !pages || pages.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', backgroundColor: 'transparent'
      }}>
        <div style={{
          textAlign: 'center', padding: '48px', backgroundColor: 'white',
          borderRadius: '4px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 500, color: '#333333', marginBottom: '12px' }}>
            {t('fileDrop.start')}
          </h2>
          <p style={{ color: '#666666', marginBottom: '32px', lineHeight: '1.625', fontSize: '13px' }}>
            {t('fileDrop.startDesc')}
            <br />
            {t('fileDrop.startFeatures')}
          </p>
        </div>
      </div>
    );
  }

  const pagesToRender = pages.filter(p => !p.deleted);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '8px', padding: '4px 0',
      }}
    >
      {pagesToRender.map((page) => (
        <div
          key={page.id}
          ref={(el) => registerPageRef(page.id, el)}
          data-page-id={page.id}
          style={{
            position: 'relative', display: 'inline-block',
            backgroundColor: 'transparent', borderRadius: '2px',
            boxShadow: page.id === currentPage.id
              ? '0 4px 8px rgba(0, 0, 0, 0.15)'
              : '0 2px 4px rgba(0, 0, 0, 0.1)',
            transition: 'box-shadow 0.2s ease-in-out',
            margin: '8px 0',
          }}
        >
          <div style={{ position: 'relative', display: 'block', width: 'fit-content', height: 'fit-content' }}>
            <PageContentRenderer
              page={page}
              scale={scale}
              pdfProxy={pdfProxy}
              insertedPdfProxies={insertedPdfProxies}
            />

            {/* Annotation Layer — 현재 페이지에만 활성화 */}
            {page.id === currentPage.id && (
              <AnnotationManager
                pageId={page.id}
                scale={scale}
                activeTool={activeTool as ToolType}
                onCreate={(annotation: Omit<Annotation, 'id'>) => {
                  if (document) {
                    const forward = [
                      { op: 'add' as const, path: `/document/pages/${document.pages.findIndex(p => p.id === annotation.pageId)}/layers/annotations/-`, value: annotation }
                    ];
                    const backward = [
                      { op: 'remove' as const, path: `/document/pages/${document.pages.findIndex(p => p.id === annotation.pageId)}/layers/annotations/${document.pages.find(p => p.id === annotation.pageId)?.layers.annotations.length || 0}` }
                    ];
                    onAddHistoryPatch('주석 추가', forward, backward);
                  }
                  try {
                    onAddAnnotation(annotation);
                  } catch (error) {
                    console.error('❌ [PageViewer] Error calling onAddAnnotation:', error);
                  }
                }}
                onUpdate={(id, updates) => {
                  onUpdateAnnotation(id, updates);
                  if (!document) return;
                  const annotation = document.pages.flatMap(p => p.layers.annotations).find(a => a.id === id);
                  if (annotation) {
                    const forward = [
                      { op: 'replace' as const, path: `/document/pages/${document.pages.findIndex(p => p.layers.annotations.some(a => a.id === id))}/layers/annotations/${document.pages.find(p => p.layers.annotations.some(a => a.id === id))?.layers.annotations.findIndex(a => a.id === id)}`, value: { ...annotation, ...updates } }
                    ];
                    const backward = [
                      { op: 'replace' as const, path: `/document/pages/${document.pages.findIndex(p => p.layers.annotations.some(a => a.id === id))}/layers/annotations/${document.pages.find(p => p.layers.annotations.some(a => a.id === id))?.layers.annotations.findIndex(a => a.id === id)}`, value: annotation }
                    ];
                    onAddHistoryPatch('주석 수정', forward, backward);
                  }
                }}
                onDelete={(id) => {
                  if (document) {
                    const annotation = document.pages.flatMap(p => p.layers.annotations).find(a => a.id === id);
                    if (annotation) {
                      const pageIndex = document.pages.findIndex(p => p.layers.annotations.some(a => a.id === id));
                      const annotationIndex = document.pages[pageIndex].layers.annotations.findIndex(a => a.id === id);
                      const forward = [{ op: 'remove' as const, path: `/document/pages/${pageIndex}/layers/annotations/${annotationIndex}` }];
                      const backward = [{ op: 'add' as const, path: `/document/pages/${pageIndex}/layers/annotations/${annotationIndex}`, value: annotation }];
                      onAddHistoryPatch('주석 삭제', forward, backward);
                    }
                  }
                  onDeleteAnnotation(id);
                }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
