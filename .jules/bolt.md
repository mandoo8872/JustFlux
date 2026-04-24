## 2024-04-22 - Prevent O(N) re-renders in ThumbnailList by memoizing ThumbnailItem
**Learning:** React re-renders lists entirely when passing inline closures in loops. ThumbnailItem suffered from unnecessary re-renders when parent's state (like `currentPageId`) changed, as every item received a new callback reference.
**Action:** Used `React.memo` for `ThumbnailItem`. Avoided inline callbacks by pushing the pageId into the child component callback invocation instead of closing over it inside `ThumbnailList`.
## 2024-04-24 - Lazy load ThumbnailItem rendering
**Learning:** `ThumbnailItem`s were all rendering immediately upon loading a PDF, which is bad for performance when loading a 100+ page PDF as `canvas.toDataURL` is expensive.
**Action:** Used `IntersectionObserver` to defer generating the thumbnail data until the `ThumbnailItem` is visible or close to visible.
