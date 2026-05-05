## 2024-04-22 - Prevent O(N) re-renders in ThumbnailList by memoizing ThumbnailItem
**Learning:** React re-renders lists entirely when passing inline closures in loops. ThumbnailItem suffered from unnecessary re-renders when parent's state (like `currentPageId`) changed, as every item received a new callback reference.
**Action:** Used `React.memo` for `ThumbnailItem`. Avoided inline callbacks by pushing the pageId into the child component callback invocation instead of closing over it inside `ThumbnailList`.

## 2024-05-05 - Avoid O(N) memory allocations and stack overflow in Math.min/max with spread operators
**Learning:** Using `Math.min(...array.map(x => ...))` for calculating bounding boxes on many items creates multiple intermediate arrays and can throw `RangeError: Maximum call stack size exceeded` for large selections.
**Action:** Replaced multiple `.map()` and `Math.min`/`max` spreads with a single-pass `for...of` loop. This reduced array allocations from O(5N) to O(1) and safely handles any number of selected items in bounding box calculations.
