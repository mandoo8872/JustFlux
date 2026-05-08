## 2024-04-22 - Prevent O(N) re-renders in ThumbnailList by memoizing ThumbnailItem
**Learning:** React re-renders lists entirely when passing inline closures in loops. ThumbnailItem suffered from unnecessary re-renders when parent's state (like `currentPageId`) changed, as every item received a new callback reference.
**Action:** Used `React.memo` for `ThumbnailItem`. Avoided inline callbacks by pushing the pageId into the child component callback invocation instead of closing over it inside `ThumbnailList`.

## 2024-04-22 - Use IntersectionObserver for off-screen PDF thumbnails
**Learning:** Generating thumbnails asynchronously for every PDF page on mount via `generateThumbnailAsync` causes severe CPU spikes and memory exhaustion when loading large PDFs (since each item creates a `<canvas>` and calls `pdfPage.render()`).
**Action:** Wrapped `generateThumbnailAsync` execution in an `IntersectionObserver` within `ThumbnailItem`. This defers thumbnail generation until the specific item scrolls near the viewport (`rootMargin: '100px'`), smoothing out performance.
