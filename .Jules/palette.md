## 2023-10-27 - Add ARIA Labels and Titles to Color Pickers
**Learning:** Native `<button>` elements styled as color pickers (common in properties panels) are already keyboard accessible, but missing `aria-label` makes them opaque to screen readers. For clickable `<div>` elements acting as buttons, `role="button"` and `tabIndex={0}` are necessary for accessibility.
**Action:** Next time I identify clickable elements without text content, verify if they are native interactive elements. If native (like `<button>`), add `aria-label` and `title`. If non-native (like `<div>`), ensure `role="button"`, `tabIndex={0}`, and `aria-label`/`title` are added, and note that `onKeyDown` is additionally needed for full interaction (Space/Enter).

## 2026-05-06 - Accessible Custom File Upload Buttons
**Learning:** When creating a custom file upload button by styling a `<label>` and hiding the inner `<input type="file">`, the input falls out of the keyboard focus order (due to `display: none`).
**Action:** Always make sure the `<label>` wrapper itself is keyboard accessible by adding `tabIndex={0}`, `role="button"`, and an `onKeyDown` handler that simulates a click on the hidden file input when 'Enter' or 'Space' is pressed.
