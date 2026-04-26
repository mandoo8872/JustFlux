## 2024-04-22 - Prevent O(N) re-renders in ThumbnailList by memoizing ThumbnailItem
**Learning:** React re-renders lists entirely when passing inline closures in loops. ThumbnailItem suffered from unnecessary re-renders when parent's state (like `currentPageId`) changed, as every item received a new callback reference.
**Action:** Used `React.memo` for `ThumbnailItem`. Avoided inline callbacks by pushing the pageId into the child component callback invocation instead of closing over it inside `ThumbnailList`.

## 2024-06-25 - Prevent concurrent heavy rendering on mount by lazy loading thumbnails
**Learning:** Generating thumbnails for every page of a large PDF concurrently on mount causes massive CPU spikes and memory exhaustion.
**Action:** Implemented `IntersectionObserver` in `ThumbnailItem` to defer `generateThumbnailAsync` execution until the thumbnail placeholder is near the viewport, avoiding rendering off-screen pages prematurely.
