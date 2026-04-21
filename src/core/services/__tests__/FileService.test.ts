import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileService } from '../FileService';
import { usePDFStore } from '../../../state/stores/PDFStore';
import { usePageStore } from '../../../state/stores/PageStore';
import {
  initNewDocument,
  selectFirstPage,
  readFileAsDataUrl,
  getImageDimensions,
  clampToA4,
} from '../fileUtils';

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
    readFileAsDataUrl: vi.fn(),
    getImageDimensions: vi.fn(),
    clampToA4: vi.fn(),
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

  describe('loadImageFile', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(1600000000000));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('successfully loads an image file and adds a page', async () => {
      const mockDoc = { id: 'test-doc-id' };
      vi.mocked(initNewDocument).mockReturnValue(mockDoc as any);

      const mockDataUrl = 'data:image/png;base64,mockdata';
      vi.mocked(readFileAsDataUrl).mockResolvedValue(mockDataUrl);

      const mockDims = { width: 1000, height: 2000 };
      vi.mocked(getImageDimensions).mockResolvedValue(mockDims);

      const mockClampedDims = { width: 500, height: 1000 };
      vi.mocked(clampToA4).mockReturnValue(mockClampedDims);

      const mockAddPage = vi.fn();
      vi.mocked(usePageStore.getState).mockReturnValue({
        addPage: mockAddPage,
      } as any);

      const mockFile = new File(['dummy content'], 'test.png', { type: 'image/png' });

      await FileService.loadImageFile(mockFile);

      expect(initNewDocument).toHaveBeenCalledWith('test.png', mockFile.size, 'images');
      expect(readFileAsDataUrl).toHaveBeenCalledWith(mockFile);
      expect(getImageDimensions).toHaveBeenCalledWith(mockDataUrl);
      expect(clampToA4).toHaveBeenCalledWith(mockDims.width, mockDims.height);

      expect(mockAddPage).toHaveBeenCalledWith({
        id: 'page_1600000000000_0',
        docId: 'test-doc-id',
        index: 0,
        width: 500,
        height: 1000,
        rotation: 0,
        layers: { rasters: [], annotations: [] },
        imageUrl: mockDataUrl,
        contentType: 'image',
      });
      expect(selectFirstPage).toHaveBeenCalled();
    });

    it('throws an error if reading the file fails', async () => {
      const mockDoc = { id: 'test-doc-id' };
      vi.mocked(initNewDocument).mockReturnValue(mockDoc as any);

      const mockError = new Error('Failed to read file');
      vi.mocked(readFileAsDataUrl).mockRejectedValue(mockError);

      const mockFile = new File(['dummy content'], 'test.png', { type: 'image/png' });

      await expect(FileService.loadImageFile(mockFile)).rejects.toThrow('Failed to read file');
    });
  });
});
