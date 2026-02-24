import { logger } from '../../utils/logger';
/**
 * FileService - 파일 처리 전용 서비스
 *
 * 공통 유틸리티는 fileUtils.ts로 추출됨.
 * 이 파일은 load/append 오케스트레이션만 담당.
 */

import { usePDFStore } from '../../state/stores/PDFStore';
import { usePageStore } from '../../state/stores/PageStore';
import { createPage } from '../model/factories';
import {
  readFileAsDataUrl,
  getImageDimensions,
  clampToA4,
  applyWidthMatching,
  initNewDocument,
  selectFirstPage,
  selectPageAtIndex,
  validateFileType,
  validateFileSize,
  getFileMetadata,
} from './fileUtils';

import type { PDFDocumentProxy } from 'pdfjs-dist';

export class FileService {
  /**
   * PDF 파일 로딩
   */
  static async loadPdfFile(file: File): Promise<void> {
    const { loadPdf } = usePDFStore.getState();

    try {
      await loadPdf(file);

      const pdfProxy = usePDFStore.getState().pdfProxy;
      if (!pdfProxy) throw new Error('PDF proxy is not available');

      const pageCount = pdfProxy.numPages;
      logger.debug(`📄 [FileService] PDF has ${pageCount} pages`);

      const doc = initNewDocument(file.name, file.size, 'pdf');

      for (let i = 0; i < pageCount; i++) {
        let width = 595, height = 842;

        try {
          const pdfPage = await pdfProxy.getPage(i + 1);
          const viewport = pdfPage.getViewport({ scale: 1.0 });
          width = viewport.width;
          height = viewport.height;
        } catch (error) {
          console.warn(`⚠️ [FileService] Failed to get page ${i + 1} dimensions:`, error);
        }

        const page = createPage({
          docId: doc.id,
          index: i,
          width, height,
          rotation: 0,
          pdfRef: { sourceIndex: i + 1 },
        });

        usePageStore.getState().addPage(page);
        logger.debug(`✅ [FileService] Added page ${i + 1}/${pageCount}`);
      }

      if (pageCount > 0) selectFirstPage();
    } catch (error) {
      console.error('Failed to load PDF:', error);
      throw error;
    }
  }

  /**
   * 이미지 파일 로딩
   */
  static async loadImageFile(file: File): Promise<void> {
    try {
      const doc = initNewDocument(file.name, file.size, 'images');

      const imageUrl = await readFileAsDataUrl(file);
      const rawDims = await getImageDimensions(imageUrl);
      const { width, height } = clampToA4(rawDims.width, rawDims.height);

      const page = {
        id: `page_${Date.now()}_0`,
        docId: doc.id,
        index: 0,
        width, height,
        rotation: 0 as const,
        layers: { rasters: [], annotations: [] },
        imageUrl,
        contentType: 'image' as const,
      };

      usePageStore.getState().addPage(page);
      selectFirstPage();
      logger.debug(`🖼️ [FileService] Image loaded: ${file.name} (${width}x${height})`);
    } catch (error) {
      console.error('Failed to load image:', error);
      throw error;
    }
  }

  /**
   * 텍스트/마크다운 파일 로딩
   */
  static async loadTextFile(file: File): Promise<void> {
    try {
      const textContent = await file.text();
      const isMarkdown = file.name.toLowerCase().endsWith('.md');
      const contentType = isMarkdown ? 'markdown' : 'text';

      const doc = initNewDocument(file.name, file.size, 'images');

      const page = {
        id: `page_${Date.now()}_0`,
        docId: doc.id,
        index: 0,
        width: 595, height: 842,
        rotation: 0 as const,
        layers: { rasters: [], annotations: [] },
        textContent,
        contentType: contentType as 'text' | 'markdown',
      };

      usePageStore.getState().addPage(page);
      selectFirstPage();
      logger.debug(`📝 [FileService] Text file loaded: ${file.name} (${textContent.length} chars)`);
    } catch (error) {
      console.error('Failed to load text file:', error);
      throw error;
    }
  }

  /**
   * PDF 파일을 기존 문서에 추가
   */
  static async appendPdfFile(file: File, matchWidth: boolean): Promise<PDFDocumentProxy> {
    const { pages } = usePageStore.getState();

    try {
      const existingWidth = pages.length > 0 ? pages[pages.length - 1].width : null;
      const existingDocId = pages.length > 0 ? pages[0].docId : 'new-doc';
      const startIndex = pages.length;

      const pdfjsLib = await import('pdfjs-dist');
      const arrayBuffer = await file.arrayBuffer();
      const pdfData = new Uint8Array(arrayBuffer);

      const loadingTask = pdfjsLib.getDocument({
        data: pdfData,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
        cMapPacked: true,
      });

      const pdfProxy = await loadingTask.promise;
      const pageCount = pdfProxy.numPages;
      logger.debug(`📄 [FileService] Appending PDF: ${file.name} (${pageCount} pages)`);

      for (let i = 0; i < pageCount; i++) {
        let width = 595, height = 842;

        try {
          const pdfPage = await pdfProxy.getPage(i + 1);
          const viewport = pdfPage.getViewport({ scale: 1.0 });
          ({ width, height } = applyWidthMatching(viewport.width, viewport.height, existingWidth, matchWidth));
        } catch (error) {
          console.warn(`⚠️ [FileService] Failed to get page ${i + 1} dimensions:`, error);
        }

        const page = createPage({
          docId: existingDocId,
          index: startIndex + i,
          width, height,
          rotation: 0,
          pdfRef: { sourceIndex: i + 1, appendedFrom: file.name },
        });

        usePageStore.getState().addPage(page);
      }

      selectPageAtIndex(startIndex);
      logger.debug(`✅ [FileService] Appended ${pageCount} pages from ${file.name}`);

      return pdfProxy as PDFDocumentProxy;
    } catch (error) {
      console.error('Failed to append PDF:', error);
      throw error;
    }
  }

  /**
   * 이미지 파일을 기존 문서에 추가
   */
  static async appendImageFile(file: File, matchWidth: boolean): Promise<void> {
    const { pages } = usePageStore.getState();

    try {
      const existingWidth = pages.length > 0 ? pages[pages.length - 1].width : null;
      const existingDocId = pages.length > 0 ? pages[0].docId : 'new-doc';
      const startIndex = pages.length;

      const imageUrl = await readFileAsDataUrl(file);
      const rawDims = await getImageDimensions(imageUrl);
      const { width, height } = applyWidthMatching(rawDims.width, rawDims.height, existingWidth, matchWidth);

      const page = {
        id: `page_${Date.now()}_${startIndex}`,
        docId: existingDocId,
        index: startIndex,
        width, height,
        rotation: 0 as const,
        layers: { rasters: [], annotations: [] },
        imageUrl,
        contentType: 'image' as const,
      };

      usePageStore.getState().addPage(page);
      usePageStore.getState().setCurrentPage(page.id);
      logger.debug(`🖼️ [FileService] Appended image: ${file.name} (${width}x${height})`);
    } catch (error) {
      console.error('Failed to append image:', error);
      throw error;
    }
  }

  // ── 유틸 위임 (하위 호환) ──
  static validateFileType = validateFileType;
  static validateFileSize = validateFileSize;
  static getFileMetadata = getFileMetadata;
}
