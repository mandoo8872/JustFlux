import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileService } from '../FileService';
import { usePDFStore } from '../../../state/stores/PDFStore';
import { usePageStore } from '../../../state/stores/PageStore';
import * as fileUtils from '../fileUtils';

// Mock dependencies
vi.mock('../../../state/stores/PDFStore', () => ({
  usePDFStore: {
    getState: vi.fn(),
  },
}));

vi.mock('../../../state/stores/PageStore', () => ({
  usePageStore: {
    getState: vi.fn(),
  },
}));

vi.mock('../fileUtils', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    initNewDocument: vi.fn(),
    selectFirstPage: vi.fn(),
    validateFileType: vi.fn(),
    validateFileSize: vi.fn(),
    getFileMetadata: vi.fn(),
  };
});

vi.mock('../../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// We can mock createPage if we want, or leave it real. It's real right now.

describe('FileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadPdfFile', () => {
    it('throws an error if pdfProxy is not available after loadPdf succeeds', async () => {
      // Mock usePDFStore.getState() to return a loadPdf that resolves, but pdfProxy remains null
      const mockLoadPdf = vi.fn().mockResolvedValue(undefined);

      vi.mocked(usePDFStore.getState).mockReturnValue({
        loadPdf: mockLoadPdf,
        pdfProxy: null,
      } as any);

      const mockFile = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });

      await expect(FileService.loadPdfFile(mockFile)).rejects.toThrow('PDF proxy is not available');

      // Verify loadPdf was actually called
      expect(mockLoadPdf).toHaveBeenCalledWith(mockFile);
    });

    it('successfully loads a PDF and adds pages', async () => {
      const mockFile = new File([''], 'test.pdf', { type: 'application/pdf' });
      const mockLoadPdf = vi.fn().mockResolvedValue(undefined);

      const mockGetPage = vi.fn().mockResolvedValue({
        getViewport: vi.fn().mockReturnValue({ width: 800, height: 600 })
      });

      const mockPdfProxy = {
        numPages: 2,
        getPage: mockGetPage
      };

      vi.mocked(usePDFStore.getState).mockReturnValue({
        loadPdf: mockLoadPdf,
        pdfProxy: mockPdfProxy,
      } as any);

      const mockAddPage = vi.fn();
      vi.mocked(usePageStore.getState).mockReturnValue({
        addPage: mockAddPage,
      } as any);

      vi.mocked(fileUtils.initNewDocument).mockReturnValue({ id: 'mock-doc-id' } as any);

      await FileService.loadPdfFile(mockFile);

      expect(mockLoadPdf).toHaveBeenCalledWith(mockFile);
      expect(fileUtils.initNewDocument).toHaveBeenCalledWith('test.pdf', mockFile.size, 'pdf');

      expect(mockPdfProxy.getPage).toHaveBeenCalledTimes(2);
      expect(mockPdfProxy.getPage).toHaveBeenNthCalledWith(1, 1);
      expect(mockPdfProxy.getPage).toHaveBeenNthCalledWith(2, 2);

      expect(mockAddPage).toHaveBeenCalledTimes(2);
      expect(mockAddPage).toHaveBeenNthCalledWith(1, expect.objectContaining({
        docId: 'mock-doc-id',
        index: 0,
        width: 800,
        height: 600,
        pdfRef: { sourceIndex: 1 }
      }));
      expect(mockAddPage).toHaveBeenNthCalledWith(2, expect.objectContaining({
        docId: 'mock-doc-id',
        index: 1,
        width: 800,
        height: 600,
        pdfRef: { sourceIndex: 2 }
      }));

      expect(fileUtils.selectFirstPage).toHaveBeenCalledTimes(1);
    });

    it('uses fallback dimensions if getPage throws an error', async () => {
      const mockFile = new File([''], 'test.pdf', { type: 'application/pdf' });
      const mockLoadPdf = vi.fn().mockResolvedValue(undefined);

      const mockGetPage = vi.fn().mockRejectedValue(new Error('Page error'));

      const mockPdfProxy = {
        numPages: 1,
        getPage: mockGetPage
      };

      vi.mocked(usePDFStore.getState).mockReturnValue({
        loadPdf: mockLoadPdf,
        pdfProxy: mockPdfProxy,
      } as any);

      const mockAddPage = vi.fn();
      vi.mocked(usePageStore.getState).mockReturnValue({
        addPage: mockAddPage,
      } as any);

      vi.mocked(fileUtils.initNewDocument).mockReturnValue({ id: 'mock-doc-id' } as any);

      await FileService.loadPdfFile(mockFile);

      expect(mockAddPage).toHaveBeenCalledTimes(1);
      expect(mockAddPage).toHaveBeenCalledWith(expect.objectContaining({
        docId: 'mock-doc-id',
        width: 595, // fallback
        height: 842, // fallback
      }));
    });

    it('throws error if loadPdf throws an error', async () => {
      const mockFile = new File([''], 'test.pdf', { type: 'application/pdf' });
      const error = new Error('load error');
      const mockLoadPdf = vi.fn().mockRejectedValue(error);

      vi.mocked(usePDFStore.getState).mockReturnValue({
        loadPdf: mockLoadPdf,
      } as any);

      await expect(FileService.loadPdfFile(mockFile)).rejects.toThrow('load error');
    });
  });
});
