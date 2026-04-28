## 2024-04-22 - Prevent O(N) re-renders in ThumbnailList by memoizing ThumbnailItem
**Learning:** React re-renders lists entirely when passing inline closures in loops. ThumbnailItem suffered from unnecessary re-renders when parent's state (like `currentPageId`) changed, as every item received a new callback reference.
**Action:** Used `React.memo` for `ThumbnailItem`. Avoided inline callbacks by pushing the pageId into the child component callback invocation instead of closing over it inside `ThumbnailList`.
## 2026-04-28 - [Defer Thumbnail Generation]
**Learning:** Generating thumbnails for all pages on mount causes a massive performance hit due to CPU and memory consumption.
**Action:** Used `IntersectionObserver` to defer thumbnail generation to off-screen items until they enter the viewport.
