## 2024-04-22 - Prevent O(N) re-renders in ThumbnailList by memoizing ThumbnailItem
**Learning:** React re-renders lists entirely when passing inline closures in loops. ThumbnailItem suffered from unnecessary re-renders when parent's state (like `currentPageId`) changed, as every item received a new callback reference.
**Action:** Used `React.memo` for `ThumbnailItem`. Avoided inline callbacks by pushing the pageId into the child component callback invocation instead of closing over it inside `ThumbnailList`.

## 2026-05-09 - Optimize ThumbnailItem rendering with IntersectionObserver
**Learning:** Generating thumbnails off-screen consumes excessive CPU and memory on mount. Rendering all PDF pages simultaneously causes severe bottlenecks on large documents.
**Action:** Replaced eager thumbnail rendering in `ThumbnailItem` with lazy loading via `IntersectionObserver`. Also implemented an `isMounted` check to prevent React state updates on unmounted components when async operations complete.
