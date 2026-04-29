## 2024-04-22 - Prevent O(N) re-renders in ThumbnailList by memoizing ThumbnailItem
**Learning:** React re-renders lists entirely when passing inline closures in loops. ThumbnailItem suffered from unnecessary re-renders when parent's state (like `currentPageId`) changed, as every item received a new callback reference.
**Action:** Used `React.memo` for `ThumbnailItem`. Avoided inline callbacks by pushing the pageId into the child component callback invocation instead of closing over it inside `ThumbnailList`.
## 2024-04-29 - O(N) bounding box passes
**Learning:** `Math.min(...array)` and `Math.max(...array)` spreads can cause "Maximum call stack size exceeded" exceptions on large arrays in addition to performance issues caused by chaining multiple `.map()` methods to resolve bounding box values.
**Action:** Replaced spread operator usage in boundary computations with simple standard `for (const x of arr)` loop constructs over single iterations to prevent potential crashes on large data and optimize execution time.
