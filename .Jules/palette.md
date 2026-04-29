## 2023-10-27 - Add ARIA Labels and Titles to Color Pickers
**Learning:** Native `<button>` elements styled as color pickers (common in properties panels) are already keyboard accessible, but missing `aria-label` makes them opaque to screen readers. For clickable `<div>` elements acting as buttons, `role="button"` and `tabIndex={0}` are necessary for accessibility.
**Action:** Next time I identify clickable elements without text content, verify if they are native interactive elements. If native (like `<button>`), add `aria-label` and `title`. If non-native (like `<div>`), ensure `role="button"`, `tabIndex={0}`, and `aria-label`/`title` are added, and note that `onKeyDown` is additionally needed for full interaction (Space/Enter).

## 2024-04-29 - Contextual Icon Buttons and Tooltips
**Learning:** In custom panels (like Figma-style Inspector properties), icon-only buttons are heavily used with `title` attributes for visual tooltips, but frequently miss corresponding `aria-label`s. Because standard UI libraries or native `<button>` tags don't automatically map `title` to screen reader text on all browsers, this leads to a widespread pattern of inaccessible control panels.
**Action:** Always verify that every icon-only button inside custom inspector panels has an `aria-label` that equals or expands upon its `title` to ensure feature parity for visual and non-visual users.
