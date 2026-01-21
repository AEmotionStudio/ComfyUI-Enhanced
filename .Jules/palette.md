## 2024-05-22 - Manual DOM Accessibility in Custom Modals
**Learning:** Custom modals (like Pattern Designer) are built using raw DOM creation and `srcdoc` iframes. Accessibility attributes (ARIA, roles) are not inherited from a framework and must be manually injected into the HTML strings or added via `setAttribute`.
**Action:** When modifying custom windows/modals, always check raw HTML strings for missing `aria-label`, `role`, and `title` attributes on interactive elements.
