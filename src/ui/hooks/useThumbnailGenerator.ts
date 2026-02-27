/**
 * useThumbnailGenerator — 페이지 썸네일 생성 훅
 *
 * ThumbnailSidebar에서 추출. 페이지 배열을 받아 썸네일 dataURL 맵을 반환.
 * PDF/빈 페이지/삽입된 PDF 모두 처리, placeholder 생성 로직 통합.
 */

import { useEffect, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { t } from '../../i18n';
import type { Page } from '../../core/model/types';
import { generateThumbnail } from '../../core/pdf/pdfLoader';

/** placeholder 캔버스 생성 (중복 제거) */
function createPlaceholderThumbnail(width: number, height: number, label: string): string {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, width - 2, height - 2);
        ctx.fillStyle = '#9ca3af';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, width / 2, height / 2);
    }

    return canvas.toDataURL('image/png');
}

interface UseThumbnailGeneratorOptions {
    pages: Page[];
    pdfProxy: PDFDocumentProxy;
    sidebarWidth: number;
    insertedPdfPages?: Set<string>;
    insertedPdfProxies?: Map<string, PDFDocumentProxy>;
}

export function useThumbnailGenerator({
    pages,
    pdfProxy,
    sidebarWidth,
    insertedPdfPages = new Set(),
    insertedPdfProxies = new Map(),
}: UseThumbnailGeneratorOptions): Record<string, string> {
    const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

    useEffect(() => {
        if (pages.length === 0) return;

        const generateAll = async () => {
            const newThumbnails: Record<string, string> = {};
            const maxThumbnailWidth = Math.max(120, sidebarWidth - 40);

            for (const page of pages) {
                try {
                    const pageAspectRatio = page.height / page.width;
                    const thumbnailWidth = maxThumbnailWidth;
                    const thumbnailHeight = thumbnailWidth * pageAspectRatio;

                    // Original PDF page
                    if (page.pdfRef && pdfProxy && !insertedPdfPages.has(page.id)) {
                        try {
                            newThumbnails[page.id] = await generateThumbnail(pdfProxy, page.pdfRef.sourceIndex - 1, thumbnailWidth);
                        } catch {
                            newThumbnails[page.id] = createPlaceholderThumbnail(thumbnailWidth, thumbnailHeight, t('pageView.pdfPage'));
                        }
                    }
                    // Inserted PDF page
                    else if (page.pdfRef && insertedPdfPages.has(page.id)) {
                        const proxy = insertedPdfProxies.get(page.id);
                        if (proxy) {
                            try {
                                newThumbnails[page.id] = await generateThumbnail(proxy, page.pdfRef.sourceIndex - 1, thumbnailWidth);
                            } catch {
                                newThumbnails[page.id] = createPlaceholderThumbnail(thumbnailWidth, thumbnailHeight, t('pageView.pdfPage'));
                            }
                        } else {
                            newThumbnails[page.id] = createPlaceholderThumbnail(thumbnailWidth, thumbnailHeight, t('pageView.pdfPage'));
                        }
                    }
                    // Blank page
                    else {
                        newThumbnails[page.id] = createPlaceholderThumbnail(thumbnailWidth, thumbnailHeight, t('pageView.blankPage'));
                    }
                } catch (error) {
                    console.error(`Failed to generate thumbnail for page ${page.index + 1}:`, error);
                }
            }

            setThumbnails(newThumbnails);
        };

        generateAll();
    }, [pdfProxy, pages, sidebarWidth, insertedPdfPages, insertedPdfProxies]);

    return thumbnails;
}
