## 2024-05-22 - Manual DOM Accessibility in Custom Modals
**Learning:** Custom modals (like Pattern Designer) are built using raw DOM creation and `srcdoc` iframes. Accessibility attributes (ARIA, roles) are not inherited from a framework and must be manually injected into the HTML strings or added via `setAttribute`.
**Action:** When modifying custom windows/modals, always check raw HTML strings for missing `aria-label`, `role`, and `title` attributes on interactive elements.

## 2024-05-23 - Focus Management in Vanilla JS Modals
**Learning:** Simply appending a modal to the DOM doesn't shift focus. Keyboard users require explicit focus management: saving the active element before opening, forcing focus to the modal (or its close button) after opening, and restoring focus upon closing.
**Action:** In `createPatternDesignerWindow` and similar utilities, capture `document.activeElement` at start, use `setTimeout` to focus the close button after DOM insertion, and restore the captured focus in the cleanup handler.

## 2024-05-24 - Inline Styles and Focus Visibility
**Learning:** When using `cssText` or inline styles to style interactive elements, browser default focus indicators may be overridden or become invisible (especially on dark backgrounds).
**Action:** Always explicitly define `onfocus` and `onblur` handlers (or equivalent CSS) to ensure visible focus states (like `outline` or color changes) for keyboard users.
