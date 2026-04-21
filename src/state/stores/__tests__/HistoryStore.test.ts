import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useHistoryStore } from '../HistoryStore';
import { useAnnotationStore } from '../AnnotationStore';

// Mock AnnotationStore
vi.mock('../AnnotationStore', () => ({
  useAnnotationStore: {
    getState: vi.fn(),
  },
}));

describe('HistoryStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useHistoryStore.getState().resetHistory();
  });

  describe('error handling', () => {
    it('sets historyError when applyActions fails during undo', () => {
      // Setup mock to throw error during 'undo' ('add' action undoes by calling removeAnnotation)
      const mockRemoveAnnotation = vi.fn().mockImplementation(() => {
        throw new Error('Test Error');
      });

      // @ts-ignore
      vi.mocked(useAnnotationStore.getState).mockReturnValue({
        removeAnnotation: mockRemoveAnnotation,
      });

      const store = useHistoryStore.getState();

      // Add an action so there's something to undo
      store.pushAction('test action', [{
        type: 'add',
        annotationId: 'test-id',
        pageId: 'test-page',
        before: null,
        after: { id: 'test-id' } as any,
      }]);

      // Ensure the state before undo is clear
      expect(useHistoryStore.getState().historyError).toBeNull();

      // Perform undo which should trigger the error
      store.undo();

      // Verify the error was caught and state updated
      expect(useHistoryStore.getState().historyError).toBe('Undo failed');
      // The currentIndex should not be decremented
      expect(useHistoryStore.getState().getCurrentIndex()).toBe(0);
    });

    it('sets historyError when applyActions fails during redo', () => {
      // Setup mock to not throw on undo, but throw on redo ('add' action redoes by calling addAnnotationToPage)
      const mockRemoveAnnotation = vi.fn();
      const mockAddAnnotationToPage = vi.fn().mockImplementation(() => {
        throw new Error('Test Redo Error');
      });

      // @ts-ignore
      vi.mocked(useAnnotationStore.getState).mockReturnValue({
        removeAnnotation: mockRemoveAnnotation,
        addAnnotationToPage: mockAddAnnotationToPage,
      });

      const store = useHistoryStore.getState();

      // Add an action so there's something to undo/redo
      store.pushAction('test action', [{
        type: 'add',
        annotationId: 'test-id',
        pageId: 'test-page',
        before: null,
        after: { id: 'test-id' } as any,
      }]);

      // Perform undo so we can redo
      store.undo();
      expect(useHistoryStore.getState().getCurrentIndex()).toBe(-1);

      // Ensure the state before redo is clear
      expect(useHistoryStore.getState().historyError).toBeNull();

      // Perform redo which should trigger the error
      store.redo();

      // Verify the error was caught and state updated
      expect(useHistoryStore.getState().historyError).toBe('Redo failed');
      // The currentIndex should not be incremented
      expect(useHistoryStore.getState().getCurrentIndex()).toBe(-1);
    });
  });
});
