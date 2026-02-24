import { logger } from '../../utils/logger';
/**
 * Export Engine - PDF/PNG/JPEG 내보내기
 */

import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { ExportOptions, Page } from '../model/types';
import { exportAsPdf } from './pdfExport';
import { exportAsPng, exportAsJpeg } from './imageExport';

/**
 * 페이지 선택 범위를 인덱스 배열로 변환
 */
export function resolvePageSelection(
  pages: ExportOptions['pages'],
  totalPages: number
): number[] {
  if (pages === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i);
  } else if (pages === 'current') {
    return [0]; // Current page will be passed separately
  } else if (Array.isArray(pages)) {
    return pages.filter((i) => i >= 0 && i < totalPages);
  }
  return Array.from({ length: totalPages }, (_, i) => i);
}

/**
 * 문서 내보내기 메인 함수
 */
export async function exportDocument(
  pages: Page[],
  pdfProxy: PDFDocumentProxy,
  options: ExportOptions,
  insertedPdfProxies?: Map<string, PDFDocumentProxy>
): Promise<Uint8Array | Blob | Blob[]> {
  const { format, pages: pageSelection = 'all' } = options;

  // 페이지 선택 범위 결정
  const pageIndices = resolvePageSelection(pageSelection, pages.length);

  logger.debug(`📤 [Export] Starting ${format} export for ${pageIndices.length} pages...`);

  switch (format) {
    case 'pdf':
      return await exportAsPdf(pages, pdfProxy, pageIndices, options, insertedPdfProxies);
    case 'png':
      return await exportAsPng(pages, pdfProxy, pageIndices, options);
    case 'jpeg':
      return await exportAsJpeg(pages, pdfProxy, pageIndices, options);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

