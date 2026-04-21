import { logger } from '../../utils/logger';
/**
 * Image Export - PNG/JPEG 형식으로 내보내기
 */

import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { ExportOptions, Page } from '../model/types';
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
  logger.debug(`🖼️ [PNG Export] Starting export for ${pageIndices.length} pages...`);

  if (pageIndices.length === 1) {
    // Single page - return directly
    const page = pages[pageIndices[0]];
    const canvas = await renderPageToCanvas(page, pdfProxy, options);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          logger.debug(`✅ [PNG Export] Complete! Size: ${(blob.size / 1024).toFixed(1)} KB`);
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, 'image/png');
    });
  } else {
    // Multiple pages - return array of blobs
    logger.debug(`  Rendering ${pageIndices.length} pages...`);
    const blobs = new Array<Blob>(pageIndices.length);
    const MAX_CONCURRENCY = 5;
    let currentIndex = 0;

    const worker = async () => {
      while (currentIndex < pageIndices.length) {
        const i = currentIndex++;
        const pageIndex = pageIndices[i];
        const page = pages[pageIndex];

        logger.debug(`  Rendering page ${i + 1}/${pageIndices.length}...`);
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

        blobs[i] = blob;
      }
    };

    const workers: Promise<void>[] = [];
    for (let i = 0; i < Math.min(MAX_CONCURRENCY, pageIndices.length); i++) {
      workers.push(worker());
    }

    await Promise.all(workers);

    logger.debug(`✅ [PNG Export] Complete! ${blobs.length} pages rendered`);
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
  logger.debug(`🖼️ [JPEG Export] Starting export for ${pageIndices.length} pages...`);

  const quality = options.quality || 0.9;

  if (pageIndices.length === 1) {
    // Single page - return directly
    const page = pages[pageIndices[0]];
    const canvas = await renderPageToCanvas(page, pdfProxy, options);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            logger.debug(`✅ [JPEG Export] Complete! Size: ${(blob.size / 1024).toFixed(1)} KB`);
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
    logger.debug(`  Rendering ${pageIndices.length} pages...`);
    const blobs = new Array<Blob>(pageIndices.length);
    const MAX_CONCURRENCY = 5;
    let currentIndex = 0;

    const worker = async () => {
      while (currentIndex < pageIndices.length) {
        const i = currentIndex++;
        const pageIndex = pageIndices[i];
        const page = pages[pageIndex];

        logger.debug(`  Rendering page ${i + 1}/${pageIndices.length}...`);
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

        blobs[i] = blob;
      }
    };

    const workers: Promise<void>[] = [];
    for (let i = 0; i < Math.min(MAX_CONCURRENCY, pageIndices.length); i++) {
      workers.push(worker());
    }

    await Promise.all(workers);

    logger.debug(`✅ [JPEG Export] Complete! ${blobs.length} pages rendered`);
    return blobs;
  }
}

