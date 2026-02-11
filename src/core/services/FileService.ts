/**
 * FileService - 파일 처리 전용 서비스
 * 파일 로딩, 검증, 변환 등 파일 관련 작업만 담당
 */

import { usePDFStore } from '../../state/stores/PDFStore';
import { usePageStore } from '../../state/stores/PageStore';
import { useDocumentStore } from '../../state/documentStore';
import { useViewStore } from '../../state/stores/ViewStore';
import { createDocument } from '../model/factories';

export class FileService {
  /**
   * PDF 파일 로딩
   */
  static async loadPdfFile(file: File): Promise<void> {
    const { loadPdf } = usePDFStore.getState();
    const { clearPages, addPage } = usePageStore.getState();
    const { setDocument } = useDocumentStore.getState();

    try {
      // PDF 로딩
      await loadPdf(file);

      // PDF에서 페이지 생성
      const pdfStore = usePDFStore.getState();
      const pdfProxy = pdfStore.pdfProxy;
      if (!pdfProxy) {
        throw new Error('PDF proxy is not available');
      }

      // PDF 페이지 수를 직접 가져오기
      const pageCount = pdfProxy.numPages;
      console.log(`📄 [FileService] PDF has ${pageCount} pages`);

      // 기존 페이지 클리어
      clearPages();

      // 새 문서 생성
      const document = createDocument({
        name: file.name,
        source: {
          kind: 'pdf' as const,
          fileName: file.name,
          fileSize: file.size
        }
      });

      setDocument(document);

      // PDF 페이지들을 PageStore에 추가
      const { createPage } = await import('../model/factories');
      console.log(`📄 [FileService] Starting to add ${pageCount} pages to PageStore`);

      for (let i = 0; i < pageCount; i++) {
        let width = 595; // A4 width 기본값
        let height = 842; // A4 height 기본값

        // PDF에서 실제 페이지 크기 가져오기
        try {
          const pdfPage = await pdfProxy.getPage(i + 1);
          const viewport = pdfPage.getViewport({ scale: 1.0 });
          width = viewport.width;
          height = viewport.height;
        } catch (error) {
          console.warn(`⚠️ [FileService] Failed to get page ${i + 1} dimensions:`, error);
          // 기본값 사용
        }

        // createPage 팩토리 함수 사용하여 pdfRef 포함
        const page = createPage({
          docId: document.id,
          index: i,
          width,
          height,
          rotation: 0,
          pdfRef: {
            sourceIndex: i + 1, // PDF 페이지는 1-based
          }
        });

        addPage(page);
        console.log(`✅ [FileService] Added page ${i + 1}/${pageCount}: id=${page.id}, index=${page.index}`);
      }

      // 페이지 추가 완료 확인
      const { pages: addedPages } = usePageStore.getState();
      console.log(`📄 [FileService] Total pages in PageStore: ${addedPages.length}`);

      // 첫 번째 페이지를 현재 페이지로 설정하고 창맞춤
      if (pageCount > 0) {
        const { setCurrentPage } = usePageStore.getState();
        const { fitToPage } = useViewStore.getState();
        const { pages } = usePageStore.getState();
        const firstPage = pages[0];
        if (firstPage) {
          setCurrentPage(firstPage.id);
          fitToPage(firstPage.width, firstPage.height);
        }
      }

    } catch (error) {
      console.error('Failed to load PDF:', error);
      throw error;
    }
  }

  /**
   * 이미지 파일 로딩 (실제 이미지 크기 사용)
   */
  static async loadImageFile(file: File): Promise<void> {
    const { clearPages, addPage } = usePageStore.getState();
    const { setDocument } = useDocumentStore.getState();
    const { setCurrentPage } = usePageStore.getState();
    const { fitToPage } = useViewStore.getState();

    try {
      // 새 문서 생성
      const document = createDocument({
        name: file.name,
        source: {
          kind: 'images' as const,
          fileName: file.name,
          fileSize: file.size
        }
      });

      setDocument(document);
      clearPages();

      // 이미지를 Data URL로 읽기
      const imageUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 이미지 크기 가져오기
      const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
        img.src = imageUrl;
      });

      // 최대 크기 제한 (A4 기준)
      const maxWidth = 595;
      const maxHeight = 842;
      let finalWidth = width;
      let finalHeight = height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        finalWidth = width * ratio;
        finalHeight = height * ratio;
      }

      // 이미지 페이지 생성
      const page = {
        id: `page_${Date.now()}_0`,
        docId: document.id,
        index: 0,
        width: finalWidth,
        height: finalHeight,
        rotation: 0 as const,
        layers: {
          rasters: [],
          annotations: []
        },
        imageUrl,
        contentType: 'image' as const
      };

      addPage(page);
      setCurrentPage(page.id);
      fitToPage(page.width, page.height);

      console.log(`🖼️ [FileService] Image loaded: ${file.name} (${finalWidth}x${finalHeight})`);

    } catch (error) {
      console.error('Failed to load image:', error);
      throw error;
    }
  }

  /**
   * 텍스트/마크다운 파일 로딩
   */
  static async loadTextFile(file: File): Promise<void> {
    const { clearPages, addPage } = usePageStore.getState();
    const { setDocument } = useDocumentStore.getState();
    const { setCurrentPage } = usePageStore.getState();
    const { fitToPage } = useViewStore.getState();

    try {
      // 파일 내용 읽기
      const textContent = await file.text();

      // 확장자로 타입 결정
      const isMarkdown = file.name.toLowerCase().endsWith('.md');
      const contentType = isMarkdown ? 'markdown' : 'text';

      // 새 문서 생성
      const document = createDocument({
        name: file.name,
        source: {
          kind: 'images' as const, // 임시로 images 사용
          fileName: file.name,
          fileSize: file.size
        }
      });

      setDocument(document);
      clearPages();

      // 텍스트 페이지 생성 (A4 크기)
      const page = {
        id: `page_${Date.now()}_0`,
        docId: document.id,
        index: 0,
        width: 595,  // A4 width
        height: 842, // A4 height
        rotation: 0 as const,
        layers: {
          rasters: [],
          annotations: []
        },
        textContent,
        contentType: contentType as 'text' | 'markdown'
      };

      addPage(page);
      setCurrentPage(page.id);
      fitToPage(page.width, page.height);

      console.log(`📝 [FileService] Text file loaded: ${file.name} (${textContent.length} chars, type: ${contentType})`);

    } catch (error) {
      console.error('Failed to load text file:', error);
      throw error;
    }
  }

  /**
   * PDF 파일을 기존 문서에 추가 (clearPages 없이)
   * matchWidth=true이면 기존 페이지 폭에 맞춰 크기 조정
   */
  static async appendPdfFile(file: File, matchWidth: boolean): Promise<any> {
    const { addPage, pages } = usePageStore.getState();

    try {
      // 기존 페이지의 폭 가져오기 (matchWidth 용)
      const existingWidth = pages.length > 0 ? pages[pages.length - 1].width : null;
      const existingDocId = pages.length > 0 ? pages[0].docId : 'new-doc';
      const startIndex = pages.length;

      // PDF.js로 직접 로딩 (PDFStore를 덮어쓰지 않기 위해)
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
      console.log(`📄 [FileService] Appending PDF: ${file.name} (${pageCount} pages)`);

      const { createPage } = await import('../model/factories');

      for (let i = 0; i < pageCount; i++) {
        let width = 595;
        let height = 842;

        try {
          const pdfPage = await pdfProxy.getPage(i + 1);
          const viewport = pdfPage.getViewport({ scale: 1.0 });
          width = viewport.width;
          height = viewport.height;
        } catch (error) {
          console.warn(`⚠️ [FileService] Failed to get page ${i + 1} dimensions:`, error);
        }

        // 폭 맞춤 적용
        if (matchWidth && existingWidth && Math.abs(width - existingWidth) > 1) {
          const ratio = existingWidth / width;
          height = height * ratio;
          width = existingWidth;
        }

        const page = createPage({
          docId: existingDocId,
          index: startIndex + i,
          width,
          height,
          rotation: 0,
          pdfRef: {
            sourceIndex: i + 1,
            appendedFrom: file.name, // 추가 출처 식별용
          }
        });

        addPage(page);
      }

      // 추가된 첫 페이지로 이동
      const { setCurrentPage } = usePageStore.getState();
      const { pages: updatedPages } = usePageStore.getState();
      const firstAppended = updatedPages[startIndex];
      if (firstAppended) {
        setCurrentPage(firstAppended.id);
      }

      console.log(`✅ [FileService] Appended ${pageCount} pages from ${file.name}`);

      // pdfProxy를 반환하여 Shell에서 insertedPdfProxies에 저장할 수 있도록
      return pdfProxy as any;

    } catch (error) {
      console.error('Failed to append PDF:', error);
      throw error;
    }
  }

  /**
   * 이미지 파일을 기존 문서에 추가
   * matchWidth=true이면 기존 페이지 폭에 맞춰 크기 조정
   */
  static async appendImageFile(file: File, matchWidth: boolean): Promise<void> {
    const { addPage, pages } = usePageStore.getState();

    try {
      const existingWidth = pages.length > 0 ? pages[pages.length - 1].width : null;
      const existingDocId = pages.length > 0 ? pages[0].docId : 'new-doc';
      const startIndex = pages.length;

      // 이미지를 Data URL로 읽기
      const imageUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 이미지 크기 가져오기
      let { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
        img.src = imageUrl;
      });

      // 폭 맞춤 적용
      if (matchWidth && existingWidth && Math.abs(width - existingWidth) > 1) {
        const ratio = existingWidth / width;
        height = height * ratio;
        width = existingWidth;
      }

      const page = {
        id: `page_${Date.now()}_${startIndex}`,
        docId: existingDocId,
        index: startIndex,
        width,
        height,
        rotation: 0 as const,
        layers: {
          rasters: [],
          annotations: []
        },
        imageUrl,
        contentType: 'image' as const
      };

      addPage(page);

      // 추가된 페이지로 이동
      const { setCurrentPage } = usePageStore.getState();
      setCurrentPage(page.id);

      console.log(`🖼️ [FileService] Appended image: ${file.name} (${width}x${height})`);

    } catch (error) {
      console.error('Failed to append image:', error);
      throw error;
    }
  }

  /**
   * 파일 타입 검증
   */
  static validateFileType(file: File): boolean {
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp',
      'text/plain',
      'text/markdown'
    ];

    // 확장자 기반 검증 추가
    const ext = file.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'txt', 'md'];

    return allowedTypes.includes(file.type) || allowedExtensions.includes(ext || '');
  }

  /**
   * 파일 크기 검증
   */
  static validateFileSize(file: File, maxSizeMB: number = 50): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  /**
   * 파일 메타데이터 추출
   */
  static getFileMetadata(file: File): {
    name: string;
    size: number;
    type: string;
    lastModified: Date;
  } {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified)
    };
  }
}
