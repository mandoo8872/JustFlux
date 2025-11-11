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
   * 이미지 파일 로딩
   */
  static async loadImageFile(file: File): Promise<void> {
    const { addPage } = usePageStore.getState();
    const { setDocument } = useDocumentStore.getState();
    
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
      
      // 이미지 페이지 생성
      const page = {
        id: `page_${Date.now()}_0`,
        docId: document.id,
        index: 0,
        width: 800, // 기본 이미지 크기
        height: 600,
        rotation: 0 as const,
        layers: {
          rasters: [],
          vectors: [],
          annotations: []
        }
      };
      
      addPage(page);
      
    } catch (error) {
      console.error('Failed to load image:', error);
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
      'image/webp'
    ];
    
    return allowedTypes.includes(file.type);
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
