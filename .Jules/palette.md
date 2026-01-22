## 2024-05-22 - Manual DOM Accessibility in Custom Modals
**Learning:** Custom modals (like Pattern Designer) are built using raw DOM creation and `srcdoc` iframes. Accessibility attributes (ARIA, roles) are not inherited from a framework and must be manually injected into the HTML strings or added via `setAttribute`.
**Action:** When modifying custom windows/modals, always check raw HTML strings for missing `aria-label`, `role`, and `title` attributes on interactive elements.

## 2024-05-23 - Focus Management in Raw DOM Modals
**Learning:** Raw DOM elements styled with `cssText` and `document.createElement` often lack default focus states. Adding `onfocus`/`onblur` handlers combined with `transition` properties provides a robust way to mimic native focus rings while maintaining custom aesthetics.
**Action:** When styling interactive elements manually, explicitly handle focus events and add visual indicators (outline/color change) to support keyboard navigation.
