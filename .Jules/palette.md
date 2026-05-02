## 2023-10-27 - Add ARIA Labels and Titles to Color Pickers
**Learning:** Native `<button>` elements styled as color pickers (common in properties panels) are already keyboard accessible, but missing `aria-label` makes them opaque to screen readers. For clickable `<div>` elements acting as buttons, `role="button"` and `tabIndex={0}` are necessary for accessibility.
**Action:** Next time I identify clickable elements without text content, verify if they are native interactive elements. If native (like `<button>`), add `aria-label` and `title`. If non-native (like `<div>`), ensure `role="button"`, `tabIndex={0}`, and `aria-label`/`title` are added, and note that `onKeyDown` is additionally needed for full interaction (Space/Enter).

## 2026-05-02 - Add ARIA Labels and Titles to Shape Controls
**Learning:** Custom icon-only toggle buttons in property inspector panels (such as those modifying shapes or colors) severely degrade screen reader comprehension when they lack proper ARIA attributes. Providing `aria-label`, `title`, and `aria-pressed` states, while using `aria-hidden="true"` on inner SVGs, brings their accessibility on par with native elements.
**Action:** Always ensure toggleable icon-only interface elements include an accurate `aria-label` for identification and `aria-pressed` to reflect their active state.
