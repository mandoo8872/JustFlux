## 2024-04-22 - Prevent O(N) re-renders in ThumbnailList by memoizing ThumbnailItem
**Learning:** React re-renders lists entirely when passing inline closures in loops. ThumbnailItem suffered from unnecessary re-renders when parent's state (like `currentPageId`) changed, as every item received a new callback reference.
**Action:** Used `React.memo` for `ThumbnailItem`. Avoided inline callbacks by pushing the pageId into the child component callback invocation instead of closing over it inside `ThumbnailList`.

## 2026-05-04 - Prevent heavy concurrent PDF rendering in ThumbnailItem using IntersectionObserver
**Learning:** Rendering all PDF pages simultaneously when a long list of thumbnails mounts can cause severe CPU and memory spikes, potentially leading to application freezes. Additionally, updating React state after a component unmounts (e.g., when a thumbnail is removed before its PDF rendering completes) causes memory leaks.
**Action:** Implemented `IntersectionObserver` in `ThumbnailItem` to defer `generateThumbnailAsync` until the component is close to entering the viewport (using `rootMargin: '200px'`). Also introduced an `isMounted` flag inside the `useEffect` to safely prevent state updates if the component unmounts before the asynchronous rendering finishes.
