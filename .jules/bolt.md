## 2024-04-22 - Prevent O(N) re-renders in ThumbnailList by memoizing ThumbnailItem
**Learning:** React re-renders lists entirely when passing inline closures in loops. ThumbnailItem suffered from unnecessary re-renders when parent's state (like `currentPageId`) changed, as every item received a new callback reference.
**Action:** Used `React.memo` for `ThumbnailItem`. Avoided inline callbacks by pushing the pageId into the child component callback invocation instead of closing over it inside `ThumbnailList`.
## 2024-05-18 - Lazy Loading PDF Thumbnails with IntersectionObserver
**Learning:** Rendering a large number of PDFs thumbnails concurrently on component mount causes severe UI blockage and large memory consumption, specifically since `ThumbnailList` has no virtualization.
**Action:** Use `IntersectionObserver` on `ThumbnailItem` to defer `pdfPage.render` until the thumbnail is actually in (or near) the viewport.
