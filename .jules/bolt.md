## 2024-04-22 - Prevent O(N) re-renders in ThumbnailList by memoizing ThumbnailItem
**Learning:** React re-renders lists entirely when passing inline closures in loops. ThumbnailItem suffered from unnecessary re-renders when parent's state (like `currentPageId`) changed, as every item received a new callback reference.
**Action:** Used `React.memo` for `ThumbnailItem`. Avoided inline callbacks by pushing the pageId into the child component callback invocation instead of closing over it inside `ThumbnailList`.

## 2025-02-12 - Optimize PDF Thumbnail Generation with IntersectionObserver
**Learning:** Generating all PDF thumbnails concurrently on component mount causes severe CPU and memory spikes, especially for large PDFs. This is a significant bottleneck.
**Action:** Use `IntersectionObserver` to defer heavy rendering operations (like generating thumbnails via `pdfjs-dist`) for off-screen items. Only render when the thumbnail approaches the viewport.
