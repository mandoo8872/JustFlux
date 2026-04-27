## 2024-04-22 - Prevent O(N) re-renders in ThumbnailList by memoizing ThumbnailItem
**Learning:** React re-renders lists entirely when passing inline closures in loops. ThumbnailItem suffered from unnecessary re-renders when parent's state (like `currentPageId`) changed, as every item received a new callback reference.
**Action:** Used `React.memo` for `ThumbnailItem`. Avoided inline callbacks by pushing the pageId into the child component callback invocation instead of closing over it inside `ThumbnailList`.

## 2024-06-21 - Defer PDF thumbnail rendering with IntersectionObserver
**Learning:** Rendering all PDF page thumbnails immediately on component mount using `pdfPage.render` creates massive CPU and memory spikes, as well as main-thread blocking, particularly for documents with many pages.
**Action:** Wrapped the thumbnail generation logic in `ThumbnailItem` with an `IntersectionObserver`. By deferring the rendering process until the thumbnail element is close to the viewport (`rootMargin: '200px'`), initial loading performance and application responsiveness were drastically improved.
