## 2023-10-27 - Add ARIA Labels and Titles to Color Pickers
**Learning:** Native `<button>` elements styled as color pickers (common in properties panels) are already keyboard accessible, but missing `aria-label` makes them opaque to screen readers. For clickable `<div>` elements acting as buttons, `role="button"` and `tabIndex={0}` are necessary for accessibility.
**Action:** Next time I identify clickable elements without text content, verify if they are native interactive elements. If native (like `<button>`), add `aria-label` and `title`. If non-native (like `<div>`), ensure `role="button"`, `tabIndex={0}`, and `aria-label`/`title` are added, and note that `onKeyDown` is additionally needed for full interaction (Space/Enter).

## 2026-05-05 - File Upload Keyboard Accessibility
**Learning:** Hidden `<input type="file">` elements wrapped in styled `<label>` elements are inaccessible to keyboard users by default, as the hidden input cannot receive focus.
**Action:** When implementing custom file upload buttons with hidden inputs, ensure the wrapping `<label>` has `tabIndex={0}`, `role="button"`, and an `onKeyDown` handler that triggers the input's `click()` event on 'Enter' or 'Space' presses.
