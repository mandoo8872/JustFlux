import { logger } from '../../utils/logger';
/**
 * PDF.js integration for loading and rendering PDFs
 * Worker-based for performance
 */

import * as pdfjsLib from 'pdfjs-dist';
import type { Document, Page } from '../model/types';
import { createDocument, createPage } from '../model/factories';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

export interface LoadPdfResult {
  document: Document;
  pdfProxy: pdfjsLib.PDFDocumentProxy;
}

/**
 * Load PDF file and create Document model
 */
export async function loadPdfFile(file: File): Promise<LoadPdfResult> {
  try {
    logger.debug(`📄 [PDF] Loading file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

    // Read file as ArrayBuffer and convert to Uint8Array immediately
    const arrayBuffer = await file.arrayBuffer();
    const originalBytes = new Uint8Array(arrayBuffer);

    // Load PDF with PDF.js (pass Uint8Array instead of ArrayBuffer)
    const loadingTask = pdfjsLib.getDocument({
      data: originalBytes,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
      cMapPacked: true,
    });

    const pdfProxy = await loadingTask.promise;

    logger.debug(`✅ [PDF] Loaded: ${pdfProxy.numPages} pages`);

    // Create document model
    const document = createDocument({
      name: file.name.replace('.pdf', ''),
      source: {
        kind: 'pdf',
        fileName: file.name,
        fileSize: file.size,
        originalBytes: originalBytes,
      },
    });

    // Create pages
    const pages: Page[] = [];
    for (let i = 1; i <= pdfProxy.numPages; i++) {
      const pdfPage = await pdfProxy.getPage(i);
      const viewport = pdfPage.getViewport({ scale: 1.0 });

      const page = createPage({
        docId: document.id,
        index: i - 1,
        width: viewport.width,
        height: viewport.height,
        pdfRef: {
          sourceIndex: i,
        },
      });

      pages.push(page);

      if (i % 10 === 0) {
        logger.debug(`   Processed ${i}/${pdfProxy.numPages} pages...`);
      }
    }

    document.pages = pages;

    logger.debug(`✅ [PDF] Document created: ${pages.length} pages`);

    return { document, pdfProxy };
  } catch (error) {
    console.error('❌ [PDF] Load failed:', error);
    throw new Error(`Failed to load PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Render PDF page to canvas
 */
export async function renderPdfPage(
  pdfProxy: pdfjsLib.PDFDocumentProxy,
  pageIndex: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.0
): Promise<void> {
  try {
    const pdfPage = await pdfProxy.getPage(pageIndex + 1); // PDF pages are 1-based
    const viewport = pdfPage.getViewport({ scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D context');
    }

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    };

    await pdfPage.render(renderContext).promise;

    logger.debug(`✅ [PDF] Rendered page ${pageIndex + 1} at ${scale}x scale`);
  } catch (error) {
    console.error(`❌ [PDF] Render failed for page ${pageIndex + 1}:`, error);
    throw error;
  }
}

/**
 * Generate thumbnail for page
 */
export async function generateThumbnail(
  pdfProxy: pdfjsLib.PDFDocumentProxy,
  pageIndex: number,
  maxWidth: number = 150,
  rotation: number = 0
): Promise<string> {
  try {
    const pdfPage = await pdfProxy.getPage(pageIndex + 1);
    const viewport = pdfPage.getViewport({ scale: 1.0, rotation });

    // Calculate scale to fit max width
    const scale = maxWidth / viewport.width;
    const scaledViewport = pdfPage.getViewport({ scale, rotation });

    const canvas = document.createElement('canvas');
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D context');
    }

    await pdfPage.render({
      canvasContext: context,
      viewport: scaledViewport,
      canvas: canvas,
    }).promise;

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error(`❌ [PDF] Thumbnail generation failed for page ${pageIndex + 1}:`, error);
    throw error;
  }
}

