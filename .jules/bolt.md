## 2024-04-22 - Prevent O(N) re-renders in ThumbnailList by memoizing ThumbnailItem
**Learning:** React re-renders lists entirely when passing inline closures in loops. ThumbnailItem suffered from unnecessary re-renders when parent's state (like `currentPageId`) changed, as every item received a new callback reference.
**Action:** Used `React.memo` for `ThumbnailItem`. Avoided inline callbacks by pushing the pageId into the child component callback invocation instead of closing over it inside `ThumbnailList`.

## 2024-05-18 - Prevent O(N) array allocation and RangeError during bulk annotation alignment
**Learning:** Using `Math.min(...bboxes.map(b => b.x))` causes multiple intermediate arrays to be allocated (`O(N)`) and can result in `RangeError: Maximum call stack size exceeded` when selecting thousands of annotations due to JavaScript engine parameter limits.
**Action:** Replace `Math.min(...array)` and `Math.max(...array)` spreads with a single-pass `for...of` loop when calculating bounding boxes across multiple entities (like selected annotations or drawn path points) to guarantee scaleability.
