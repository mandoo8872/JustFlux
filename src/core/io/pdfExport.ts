/**
 * PDF Export - PDF 형식으로 내보내기
 */

import { PDFDocument } from 'pdf-lib';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { Document, ExportOptions, Page } from '../model/types';
import { renderPageToCanvas, canvasToImageBytes } from './pageRenderer';

/**
 * PDF로 내보내기 (Smart Mode)
 * 편집된 페이지만 재렌더링하고, 편집되지 않은 페이지는 원본 그대로 복사
 */
export async function exportAsPdf(
  pages: Page[],
  pdfProxy: PDFDocumentProxy,
  pageIndices: number[],
  options: ExportOptions,
  insertedPdfProxies?: Map<string, PDFDocumentProxy>
): Promise<Uint8Array> {
  try {
    console.log(`📄 [PDF Export] Starting export...`);
    console.log(`  Total pages to export: ${pageIndices.length}`);

    const newPdf = await PDFDocument.create();

    for (let i = 0; i < pageIndices.length; i++) {
      const pageIndex = pageIndices[i];
      const page = pages[pageIndex];

      if (!page) {
        console.warn(`  Page ${pageIndex + 1} not found, skipping...`);
        continue;
      }

      // Always re-render pages to include all content
      console.log(`  Rendering page ${pageIndex + 1}/${pageIndices.length}...`);
      const canvas = await renderPageToCanvas(page, pdfProxy, options, insertedPdfProxies);
      const imageBytes = await canvasToImageBytes(canvas, 'png');
      const image = await newPdf.embedPng(imageBytes);

      // Create PDF page with same dimensions as canvas
      const pdfPage = newPdf.addPage([canvas.width, canvas.height]);
      pdfPage.drawImage(image, {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height,
      });

      // Progress logging
      if ((i + 1) % 5 === 0 || i === pageIndices.length - 1) {
        console.log(`  Progress: ${i + 1}/${pageIndices.length} pages complete`);
      }
    }

    const pdfBytes = await newPdf.save();
    console.log(`✅ [PDF Export] Complete! Size: ${(pdfBytes.length / 1024).toFixed(1)} KB`);

    return pdfBytes;
  } catch (error) {
    console.error('❌ [PDF Export] Failed:', error);
    throw error;
  }
}

