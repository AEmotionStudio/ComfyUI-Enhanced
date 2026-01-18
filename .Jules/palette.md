# Palette's Journal

## 2026-01-18 - Modal Accessibility & Interaction
**Learning:** When using `document.createElement` with inline `cssText` for UI components, standard CSS pseudo-classes (`:hover`, `:focus`) are unavailable. This requires manual JS event listeners (`onmouseenter`, `onfocus`) to create accessible, interactive states.
**Action:** For future "vanilla" DOM components in this codebase, always implement `onfocus`/`onblur` alongside visual styles to ensure keyboard accessibility isn't lost due to the lack of a stylesheet.
