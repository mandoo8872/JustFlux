/**
 * PageContentRenderer — 페이지 contentType별 렌더링
 *
 * PageViewer에서 추출. 페이지 타입(PDF, 텍스트, 이미지, 빈 페이지)에 따라 적절한 뷰를 렌더링.
 */

import { PageView } from '../viewer/PageView';
import { BlankPageView } from '../viewer/BlankPageView';
import { TextPageView } from '../viewer/TextPageView';
import { ImagePageView } from '../viewer/ImagePageView';
import type { Page } from '../../core/model/types';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface PageContentRendererProps {
    page: Page;
    scale: number;
    pdfProxy: PDFDocumentProxy | null;
    insertedPdfProxies?: Map<string, PDFDocumentProxy>;
}

export function PageContentRenderer({ page, scale, pdfProxy, insertedPdfProxies }: PageContentRendererProps) {
    // Text/Markdown
    if (page.contentType === 'text' || page.contentType === 'markdown') {
        return (
            <TextPageView
                pageId={page.id}
                textContent={page.textContent || ''}
                contentType={page.contentType}
                scale={scale}
                width={page.width}
                height={page.height}
            />
        );
    }

    // Image
    if (page.contentType === 'image' && page.imageUrl) {
        return (
            <ImagePageView
                pageId={page.id}
                imageUrl={page.imageUrl}
                scale={scale}
                width={page.width}
                height={page.height}
            />
        );
    }

    // PDF
    if (page.pdfRef) {
        const resolvedProxy = page.pdfRef.appendedFrom
            ? insertedPdfProxies?.get(page.pdfRef.appendedFrom) || null
            : pdfProxy;

        if (resolvedProxy) {
            return (
                <PageView
                    pageId={page.id}
                    pageIndex={page.pdfRef.sourceIndex - 1}
                    pdfProxy={resolvedProxy}
                    scale={scale}
                    onRenderComplete={() => { }}
                />
            );
        }
    }

    // Blank
    return <BlankPageView page={page} scale={scale} />;
}
