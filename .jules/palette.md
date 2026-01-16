## 2026-01-16 - Raw HTML Injection Accessibility
**Learning:** The project uses raw HTML strings (e.g., in `src/utils/designer.ts`) to create complex UI elements like the "About" window. These strings often lack accessibility attributes (`aria-label`, `role`) on interactive elements like close buttons and icon-only links.
**Action:** When working with injected HTML templates, always verify and add `aria-label` or other ARIA attributes to interactive elements, especially icon-only buttons and links.
