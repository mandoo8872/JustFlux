## 2024-04-22 - Prevent O(N) re-renders in ThumbnailList by memoizing ThumbnailItem
**Learning:** React re-renders lists entirely when passing inline closures in loops. ThumbnailItem suffered from unnecessary re-renders when parent's state (like `currentPageId`) changed, as every item received a new callback reference.
**Action:** Used `React.memo` for `ThumbnailItem`. Avoided inline callbacks by pushing the pageId into the child component callback invocation instead of closing over it inside `ThumbnailList`.

## 2024-05-02 - Deferred PDF Thumbnail Rendering using IntersectionObserver
**Learning:** Generating thumbnails for a PDF document containing many pages causes a severe CPU and memory spike when executing `pdfProxy.getPage` concurrently on component mount. Eager generation of thumbnails that are outside the viewport blocks the main thread.
**Action:** Implemented `IntersectionObserver` to defer asynchronous generation (`generateThumbnailAsync`) of thumbnails for `ThumbnailItem` until the component is nearing the viewport. This significantly avoids upfront processing, optimizing both startup loading time and memory limits when viewing large PDFs.
