import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnnotationService } from '../AnnotationService';
import { annotationRegistry } from '../AnnotationRegistry';
import type { Annotation } from '../../../../core/model/types';

// Mock logger
vi.mock('../../../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock AnnotationRegistry
vi.mock('../AnnotationRegistry', () => ({
  annotationRegistry: {
    getRenderer: vi.fn(),
  },
}));

describe('AnnotationService', () => {
  let annotationService: AnnotationService;

  beforeEach(() => {
    vi.clearAllMocks();
    annotationService = new AnnotationService();
  });

  describe('cloneAnnotation', () => {
    it('should clone an annotation with a new id and shifted bbox', () => {
      // Mock validateAnnotation to return true
      const mockValidate = vi.fn().mockReturnValue(true);

      vi.mocked(annotationRegistry.getRenderer).mockReturnValue({
        validate: mockValidate,
      } as any);

      const originalAnnotation: Annotation = {
        id: 'original-id',
        type: 'text',
        pageId: 'page-1',
        bbox: { x: 100, y: 100, width: 50, height: 20 },
        createdAt: 1234567890,
        modifiedAt: 1234567890,
        style: {},
      };

      const cloned = annotationService.cloneAnnotation(originalAnnotation);

      expect(cloned).not.toBeNull();
      expect(cloned?.id).not.toBe('original-id');
      expect(cloned?.id).toMatch(/^annotation-\d+-[a-z0-9]+$/);
      expect(cloned?.bbox.x).toBe(110); // 100 + 10
      expect(cloned?.bbox.y).toBe(110); // 100 + 10
      expect(cloned?.bbox.width).toBe(50);
      expect(cloned?.bbox.height).toBe(20);

      // Other properties should be copied over
      expect(cloned?.type).toBe('text');
      expect(cloned?.pageId).toBe('page-1');
      expect(cloned?.createdAt).toBe(1234567890);
    });

    it('should return null if validation fails for the cloned annotation', () => {
      // Mock validateAnnotation to return false
      const mockValidate = vi.fn().mockReturnValue(false);

      vi.mocked(annotationRegistry.getRenderer).mockReturnValue({
        validate: mockValidate,
      } as any);

      const originalAnnotation: Annotation = {
        id: 'original-id',
        type: 'shape',
        pageId: 'page-1',
        bbox: { x: 50, y: 50, width: 30, height: 30 },
        createdAt: 1234567890,
        modifiedAt: 1234567890,
        style: {},
      };

      const cloned = annotationService.cloneAnnotation(originalAnnotation);

      expect(cloned).toBeNull();
    });

    it('should return null if renderer for the annotation type is not found (validation fails)', () => {
      // Mock getRenderer to return null
      vi.mocked(annotationRegistry.getRenderer).mockReturnValue(null);

      const originalAnnotation: Annotation = {
        id: 'original-id',
        type: 'unknown_type',
        pageId: 'page-1',
        bbox: { x: 50, y: 50, width: 30, height: 30 },
        createdAt: 1234567890,
        modifiedAt: 1234567890,
        style: {},
      };

      const cloned = annotationService.cloneAnnotation(originalAnnotation);

      expect(cloned).toBeNull();
    });
  });
});
