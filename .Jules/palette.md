## 2023-10-27 - Add ARIA Labels and Titles to Color Pickers
**Learning:** Native `<button>` elements styled as color pickers (common in properties panels) are already keyboard accessible, but missing `aria-label` makes them opaque to screen readers. For clickable `<div>` elements acting as buttons, `role="button"` and `tabIndex={0}` are necessary for accessibility.
**Action:** Next time I identify clickable elements without text content, verify if they are native interactive elements. If native (like `<button>`), add `aria-label` and `title`. If non-native (like `<div>`), ensure `role="button"`, `tabIndex={0}`, and `aria-label`/`title` are added, and note that `onKeyDown` is additionally needed for full interaction (Space/Enter).

## 2024-04-30 - Accessible Custom File Upload Buttons
**Learning:** When creating a custom file upload button by wrapping a visually hidden `<input type="file">` in a `<label>`, the label does not automatically receive keyboard focus. To make it accessible, the label must have `tabIndex={0}`, `role="button"`, and an `onKeyDown` handler that programmatically triggers the file input's `click()` method (accessed via a `useRef`) on 'Enter' or 'Space'.
**Action:** When styling file inputs, ensure the wrapping label or custom container is fully keyboard interactive with `tabIndex`, ARIA roles, and keyboard event handlers.
