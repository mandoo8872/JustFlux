import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileService } from '../FileService';
import { usePDFStore } from '../../../state/stores/PDFStore';

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
  });
});
