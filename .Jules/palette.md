## 2023-10-27 - Add ARIA Labels and Titles to Color Pickers
**Learning:** Native `<button>` elements styled as color pickers (common in properties panels) are already keyboard accessible, but missing `aria-label` makes them opaque to screen readers. For clickable `<div>` elements acting as buttons, `role="button"` and `tabIndex={0}` are necessary for accessibility.
**Action:** Next time I identify clickable elements without text content, verify if they are native interactive elements. If native (like `<button>`), add `aria-label` and `title`. If non-native (like `<div>`), ensure `role="button"`, `tabIndex={0}`, and `aria-label`/`title` are added, and note that `onKeyDown` is additionally needed for full interaction (Space/Enter).

## 2026-05-07 - [File Upload Keyboard Accessibility]
**Learning:** When creating custom file upload buttons by wrapping a visually hidden `<input type="file">` inside a `<label>`, it loses native keyboard interaction (like pressing Enter or Space to open the file dialog). Screen readers might also not announce it correctly without explicit roles and labels.
**Action:** Always add `tabIndex={0}`, `role="button"`, an `aria-label`, and an `onKeyDown` handler that manually triggers the input's `click()` event on Enter or Space when using the hidden input pattern.
