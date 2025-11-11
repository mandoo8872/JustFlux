/**
 * Image Export - PNG/JPEG 형식으로 내보내기
 */

import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { Document, ExportOptions, Page } from '../model/types';
import { renderPageToCanvas } from './pageRenderer';

/**
 * PNG로 내보내기
 */
export async function exportAsPng(
  pages: Page[],
  pdfProxy: PDFDocumentProxy,
  pageIndices: number[],
  options: ExportOptions
): Promise<Blob | Blob[]> {
  console.log(`🖼️ [PNG Export] Starting export for ${pageIndices.length} pages...`);

  if (pageIndices.length === 1) {
    // Single page - return directly
    const page = pages[pageIndices[0]];
    const canvas = await renderPageToCanvas(page, pdfProxy, options);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          console.log(`✅ [PNG Export] Complete! Size: ${(blob.size / 1024).toFixed(1)} KB`);
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, 'image/png');
    });
  } else {
    // Multiple pages - return array of blobs
    console.log(`  Rendering ${pageIndices.length} pages...`);
    const blobs: Blob[] = [];

    for (let i = 0; i < pageIndices.length; i++) {
      const pageIndex = pageIndices[i];
      const page = pages[pageIndex];
      
      console.log(`  Rendering page ${i + 1}/${pageIndices.length}...`);
      const canvas = await renderPageToCanvas(page, pdfProxy, options);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) {
            resolve(b);
          } else {
            reject(new Error(`Failed to convert page ${pageIndex + 1} to blob`));
          }
        }, 'image/png');
      });

      blobs.push(blob);
    }

    console.log(`✅ [PNG Export] Complete! ${blobs.length} pages rendered`);
    return blobs;
  }
}

/**
 * JPEG로 내보내기
 */
export async function exportAsJpeg(
  pages: Page[],
  pdfProxy: PDFDocumentProxy,
  pageIndices: number[],
  options: ExportOptions
): Promise<Blob | Blob[]> {
  console.log(`🖼️ [JPEG Export] Starting export for ${pageIndices.length} pages...`);

  const quality = options.quality || 0.9;

  if (pageIndices.length === 1) {
    // Single page - return directly
    const page = pages[pageIndices[0]];
    const canvas = await renderPageToCanvas(page, pdfProxy, options);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log(`✅ [JPEG Export] Complete! Size: ${(blob.size / 1024).toFixed(1)} KB`);
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        'image/jpeg',
        quality
      );
    });
  } else {
    // Multiple pages - return array of blobs
    console.log(`  Rendering ${pageIndices.length} pages...`);
    const blobs: Blob[] = [];

    for (let i = 0; i < pageIndices.length; i++) {
      const pageIndex = pageIndices[i];
      const page = pages[pageIndex];
      
      console.log(`  Rendering page ${i + 1}/${pageIndices.length}...`);
      const canvas = await renderPageToCanvas(page, pdfProxy, options);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) {
              resolve(b);
            } else {
              reject(new Error(`Failed to convert page ${pageIndex + 1} to blob`));
            }
          },
          'image/jpeg',
          quality
        );
      });

      blobs.push(blob);
    }

    console.log(`✅ [JPEG Export] Complete! ${blobs.length} pages rendered`);
    return blobs;
  }
}

