import { describe, it, expect, vi, beforeEach } from 'vitest';
import { annotationService } from './AnnotationService';
import { annotationRegistry } from './AnnotationRegistry';

// Mock logger
vi.mock('../../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock AnnotationRegistry
vi.mock('./AnnotationRegistry', () => ({
  annotationRegistry: {
    getRenderer: vi.fn(),
  },
}));

describe('AnnotationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Spy on console.error and mock implementation to suppress output during tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('createAnnotation', () => {
    it('creates an annotation successfully when valid', () => {
      const mockRenderer = {
        getDefaultProps: vi.fn().mockReturnValue({
          type: 'text',
          bbox: { x: 0, y: 0, width: 100, height: 100 },
          style: { strokeColor: '#000000' }
        }),
        validate: vi.fn().mockReturnValue(true)
      };

      vi.mocked(annotationRegistry.getRenderer).mockReturnValue(mockRenderer as any);

      const result = annotationService.createAnnotation(
        'text',
        'page-1',
        { text: 'Hello World' } as any,
        { fillColor: '#ffffff' }
      );

      expect(annotationRegistry.getRenderer).toHaveBeenCalledWith('text');
      expect(mockRenderer.getDefaultProps).toHaveBeenCalled();
      expect(mockRenderer.validate).toHaveBeenCalled();

      expect(result).not.toBeNull();
      expect(result?.type).toBe('text');
      expect(result?.pageId).toBe('page-1');
      expect((result as any)?.text).toBe('Hello World');
      expect(result?.style).toEqual({ strokeColor: '#000000', fillColor: '#ffffff' });
      expect(result?.id).toMatch(/^annotation_\d+_[a-z0-9]+$/);
      expect(result?.createdAt).toBeDefined();
      expect(result?.modifiedAt).toBeDefined();
    });

    it('returns null and logs error when renderer is not found', () => {
      vi.mocked(annotationRegistry.getRenderer).mockReturnValue(null);

      const result = annotationService.createAnnotation('unknown', 'page-1', {});

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('No renderer found for type: unknown'));
    });

    it('returns null and logs error when validation fails', () => {
      const mockRenderer = {
        getDefaultProps: vi.fn().mockReturnValue({
          type: 'text',
          style: {}
        }),
        validate: vi.fn().mockReturnValue(false) // Validation fails
      };

      vi.mocked(annotationRegistry.getRenderer).mockReturnValue(mockRenderer as any);

      const result = annotationService.createAnnotation('text', 'page-1', {});

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Invalid annotation data for type: text'));
    });

    it('properly merges default props, passed props, and styles', () => {
      const mockRenderer = {
        getDefaultProps: vi.fn().mockReturnValue({
          type: 'rect',
          bbox: { x: 10, y: 10, width: 50, height: 50 },
          opacity: 1,
          style: { strokeColor: 'red', strokeWidth: 2 }
        }),
        validate: vi.fn().mockReturnValue(true)
      };

      vi.mocked(annotationRegistry.getRenderer).mockReturnValue(mockRenderer as any);

      const result = annotationService.createAnnotation(
        'rect',
        'page-2',
        { bbox: { x: 20, y: 20, width: 100, height: 100 }, opacity: 0.5 } as any,
        { strokeColor: 'blue' }
      );

      expect(result?.type).toBe('rect');
      // Passed props should override default props
      expect(result?.bbox).toEqual({ x: 20, y: 20, width: 100, height: 100 });
      expect((result as any)?.opacity).toBe(0.5);

      // Styles should be merged
      expect(result?.style).toEqual({ strokeColor: 'blue', strokeWidth: 2 });
      expect(result?.pageId).toBe('page-2');
    });
  });
});
