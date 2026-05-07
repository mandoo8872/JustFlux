## 2024-04-22 - Prevent O(N) re-renders in ThumbnailList by memoizing ThumbnailItem
**Learning:** React re-renders lists entirely when passing inline closures in loops. ThumbnailItem suffered from unnecessary re-renders when parent's state (like `currentPageId`) changed, as every item received a new callback reference.
**Action:** Used `React.memo` for `ThumbnailItem`. Avoided inline callbacks by pushing the pageId into the child component callback invocation instead of closing over it inside `ThumbnailList`.

## 2025-02-18 - Optimize PDF rendering overhead in ThumbnailItem
**Learning:** Initializing all PDF pages synchronously block the main thread and dramatically increases memory usage during the initial load since each canvas generation process runs concurrently. This is a severe performance bottleneck for large PDFs.
**Action:** Implemented `IntersectionObserver` with a `isMounted` flag inside `ThumbnailItem`'s `useEffect` to ensure `generateThumbnailAsync` is deferred until the item is near the viewport (`rootMargin: '100px'`). This provides smooth lazy loading behavior while preventing unmounted component state update warnings.
