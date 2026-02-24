/**
 * useExportHandler — 내보내기 비즈니스 로직 훅
 *
 * ExportPanel에서 추출. 페이지 범위 파싱, 내보내기 실행,
 * ZIP/개별 다운로드, 진행률 관리를 캡슐화.
 */

import { useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { Document, ExportOptions } from '../../core/model/types';
import { exportDocument } from '../../core/io/exportEngine';
import { downloadBlob, downloadUint8Array } from '../../utils/fileDownload';
import { usePageStore } from '../../state/stores/PageStore';
import { useAnnotationStore } from '../../state/stores/AnnotationStore';
import JSZip from 'jszip';

/** 페이지 범위 파싱 (예: "1-5", "1,3,5", "1-3,5-7") */
export function parsePageRange(range: string, totalPages: number): number[] {
    if (!range.trim()) return [];

    const pages: number[] = [];
    const parts = range.split(',');

    for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
            const [start, end] = trimmed.split('-').map(s => parseInt(s.trim(), 10));
            if (!isNaN(start) && !isNaN(end)) {
                const startIdx = Math.max(1, Math.min(start, totalPages)) - 1;
                const endIdx = Math.max(1, Math.min(end, totalPages)) - 1;
                for (let i = startIdx; i <= endIdx; i++) {
                    if (!pages.includes(i)) pages.push(i);
                }
            }
        } else {
            const pageNum = parseInt(trimmed, 10);
            if (!isNaN(pageNum)) {
                const idx = Math.max(1, Math.min(pageNum, totalPages)) - 1;
                if (!pages.includes(idx)) pages.push(idx);
            }
        }
    }

    return pages.sort((a, b) => a - b);
}

interface UseExportHandlerOptions {
    document: Document;
    pdfProxy: PDFDocumentProxy;
    currentPageIndex: number;
    onClose: () => void;
    insertedPdfProxies?: Map<string, PDFDocumentProxy>;
}

export interface ExportState {
    isExporting: boolean;
    progress: number;
    success: boolean;
}

export function useExportHandler({
    document,
    pdfProxy,
    currentPageIndex,
    onClose,
    insertedPdfProxies,
}: UseExportHandlerOptions) {
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [success, setSuccess] = useState(false);

    const { pages } = usePageStore();

    const handleExport = async (
        format: 'pdf' | 'png' | 'jpeg',
        pageRange: 'all' | 'current' | 'custom',
        customPageRange: string,
        dpi: number,
        quality: number,
        useZip: boolean,
    ) => {
        try {
            setIsExporting(true);
            setProgress(0);

            // Determine page range
            let selectedPages: number[] | 'all';
            if (pageRange === 'all') {
                selectedPages = 'all';
            } else if (pageRange === 'current') {
                selectedPages = [currentPageIndex];
            } else {
                const parsed = parsePageRange(customPageRange, pages.length);
                if (parsed.length === 0) {
                    alert('올바른 페이지 범위를 입력해주세요. (예: 1-5, 1,3,5)');
                    setIsExporting(false);
                    return;
                }
                selectedPages = parsed;
            }

            const options: ExportOptions = {
                format,
                pages: selectedPages,
                dpi,
                quality: format === 'jpeg' ? quality / 100 : undefined,
                includeAnnotations: true,
                includeRasterLayers: true,
            };

            setProgress(10);
            const { annotations } = useAnnotationStore.getState();

            const pagesWithAnnotations = pages.map(page => ({
                ...page,
                layers: {
                    ...page.layers,
                    annotations: annotations.filter(a => a.pageId === page.id),
                },
            }));

            const result = await exportDocument(pagesWithAnnotations, pdfProxy, options, insertedPdfProxies);
            setProgress(80);

            const extension = format === 'pdf' ? 'pdf' : format;
            const baseName = document.name.replace(/\.[^/.]+$/, '') || 'document';

            if (result instanceof Uint8Array) {
                downloadUint8Array(result, `${baseName}_exported.${extension}`, 'application/pdf');
                setProgress(100);
            } else if (Array.isArray(result)) {
                const isMultiplePages = result.length > 1;
                const shouldUseZip = isMultiplePages && useZip && (format === 'png' || format === 'jpeg');

                if (shouldUseZip) {
                    setProgress(85);
                    const zip = new JSZip();
                    result.forEach((blob, index) => {
                        const pageNum = Array.isArray(selectedPages) ? selectedPages[index] + 1 : index + 1;
                        zip.file(`page${pageNum.toString().padStart(3, '0')}.${extension}`, blob);
                    });
                    setProgress(95);
                    const zipBlob = await zip.generateAsync({ type: 'blob' });
                    downloadBlob(zipBlob, `${baseName}_pages.zip`);
                    setProgress(100);
                } else {
                    setProgress(85);
                    for (let i = 0; i < result.length; i++) {
                        const pageNum = Array.isArray(selectedPages) ? selectedPages[i] + 1 : i + 1;
                        if (i > 0) await new Promise(resolve => setTimeout(resolve, 100));
                        downloadBlob(result[i], `${baseName}_page${pageNum}.${extension}`);
                        setProgress(85 + Math.floor((i + 1) / result.length * 15));
                    }
                    setProgress(100);
                }
            } else {
                const pageNum = Array.isArray(selectedPages) ? selectedPages[0] + 1 : currentPageIndex + 1;
                downloadBlob(result, `${baseName}_page${pageNum}.${extension}`);
                setProgress(100);
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setProgress(0);
            }, 1500);
        } catch (error) {
            console.error('Export failed:', error);
            alert(`내보내기 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
            setIsExporting(false);
            setProgress(0);
        }
    };

    return { isExporting, progress, success, pages, handleExport };
}
