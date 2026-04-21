import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileService } from '../FileService';
import { usePDFStore } from '../../../state/stores/PDFStore';
import { usePageStore } from '../../../state/stores/PageStore';
import { initNewDocument, selectFirstPage } from '../fileUtils';

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

    it('uses fallback dimensions and logs a warning when getPage throws an error', async () => {
      const mockLoadPdf = vi.fn().mockResolvedValue(undefined);
      const mockError = new Error('Failed to get page');

      const mockPdfProxy = {
        numPages: 1,
        getPage: vi.fn().mockRejectedValue(mockError),
      };

      vi.mocked(usePDFStore.getState).mockReturnValue({
        loadPdf: mockLoadPdf,
        pdfProxy: mockPdfProxy,
      } as any);

      const mockAddPage = vi.fn();
      vi.mocked(usePageStore.getState).mockReturnValue({
        addPage: mockAddPage,
      } as any);

      vi.mocked(initNewDocument).mockReturnValue({ id: 'test-doc-id' } as any);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const mockFile = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });

      await FileService.loadPdfFile(mockFile);

      expect(mockPdfProxy.getPage).toHaveBeenCalledWith(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️ [FileService] Failed to get page 1 dimensions:', mockError);

      // Since getPage failed, fallback dimensions should be used (595x842)
      expect(mockAddPage).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 595,
          height: 842,
          docId: 'test-doc-id',
          index: 0,
        })
      );

      expect(selectFirstPage).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });
});
