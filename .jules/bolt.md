## 2024-04-22 - Prevent O(N) re-renders in ThumbnailList by memoizing ThumbnailItem
**Learning:** React re-renders lists entirely when passing inline closures in loops. ThumbnailItem suffered from unnecessary re-renders when parent's state (like `currentPageId`) changed, as every item received a new callback reference.
**Action:** Used `React.memo` for `ThumbnailItem`. Avoided inline callbacks by pushing the pageId into the child component callback invocation instead of closing over it inside `ThumbnailList`.

## 2024-05-11 - Prevent O(N) array allocations and stack overflow in bounding box calculations
**Learning:** Using multiple `.map()` calls and `Math.min(...arr)` or `Math.max(...arr)` spread operators to compute bounding boxes creates O(N) intermediate array allocations and causes `RangeError: Maximum call stack size exceeded` for large sets of items.
**Action:** Always use a single-pass `for...of` loop with manual min/max variables when computing bounding boxes for annotations or selected elements in `AnnotationStore.ts` and `AnnotationManager.tsx`.
