import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useHistoryStore } from '../HistoryStore';
import { useAnnotationStore } from '../AnnotationStore';
import type { AnnotationAction } from '../HistoryStore';

// Mock the AnnotationStore
vi.mock('../AnnotationStore', () => ({
  useAnnotationStore: {
    getState: vi.fn(),
  },
}));

describe('HistoryStore Error Paths', () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    useHistoryStore.getState().resetHistory();
    useHistoryStore.setState({ historyError: null });

    // Suppress console.error in tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('should handle applyActions failure during undo', () => {
    // Setup mock to throw when applyActions runs during undo
    const mockAnnotationStore = {
      removeAnnotation: vi.fn().mockImplementation(() => {
        throw new Error('Mock undo error');
      }),
    };
    (useAnnotationStore.getState as any).mockReturnValue(mockAnnotationStore);

    const store = useHistoryStore.getState();

    // Push an action so we can undo
    const action: AnnotationAction = {
      type: 'add',
      annotationId: 'test-1',
      pageId: 'page-1',
      before: null,
      after: { id: 'test-1', type: 'text', pageId: 'page-1', x: 0, y: 0 } as any,
    };
    store.pushAction('Add text', [action]);

    // Perform undo
    store.undo();

    // Assert that the error was caught and state updated
    const updatedStore = useHistoryStore.getState();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[HistoryStore] Undo failed:',
      expect.any(Error)
    );
    expect(updatedStore.historyError).toBe('Undo failed');
  });

  it('should handle applyActions failure during redo', () => {
    // First setup a mock that DOES NOT throw for the undo, but THROWS for the redo
    const mockAnnotationStore = {
      removeAnnotation: vi.fn(), // Needed for successful undo of an 'add' action
      addAnnotationToPage: vi.fn().mockImplementation(() => {
        throw new Error('Mock redo error');
      }),
    };
    (useAnnotationStore.getState as any).mockReturnValue(mockAnnotationStore);

    const store = useHistoryStore.getState();

    // Push an action
    const action: AnnotationAction = {
      type: 'add',
      annotationId: 'test-2',
      pageId: 'page-1',
      before: null,
      after: { id: 'test-2', type: 'text', pageId: 'page-1', x: 0, y: 0 } as any,
    };
    store.pushAction('Add text', [action]);

    // Perform undo successfully
    store.undo();

    // Now perform redo
    store.redo();

    // Assert that the error was caught and state updated
    const updatedStore = useHistoryStore.getState();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[HistoryStore] Redo failed:',
      expect.any(Error)
    );
    expect(updatedStore.historyError).toBe('Redo failed');
  });
});
