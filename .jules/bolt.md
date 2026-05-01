## 2024-04-22 - Prevent O(N) re-renders in ThumbnailList by memoizing ThumbnailItem
**Learning:** React re-renders lists entirely when passing inline closures in loops. ThumbnailItem suffered from unnecessary re-renders when parent's state (like `currentPageId`) changed, as every item received a new callback reference.
**Action:** Used `React.memo` for `ThumbnailItem`. Avoided inline callbacks by pushing the pageId into the child component callback invocation instead of closing over it inside `ThumbnailList`.

## $(date +%Y-%m-%d) - Defer PDF Thumbnail Generation with IntersectionObserver
**Learning:** In a PDF viewer, rendering all page thumbnails simultaneously on mount causes severe CPU and memory spikes because each thumbnail triggers an asynchronous `pdfPage.render` operation. This is a common performance bottleneck specific to this architecture.
**Action:** Always defer heavy rendering operations for off-screen items. Use `IntersectionObserver` in the `useEffect` hook to lazily trigger the rendering only when the item is close to entering the viewport (e.g., using `rootMargin: '100px'`). Include an `isMounted` flag to prevent state updates if the component unmounts before the async render completes.
