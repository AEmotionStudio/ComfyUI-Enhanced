# Palette's Journal

## 2025-02-18 - Accessibility in Dynamic Content
**Learning:** Dynamically created modals often lack basic ARIA attributes, especially when generating HTML strings for iframes.
**Action:** Always verify `aria-label`, `role="dialog"`, and `aria-modal="true"` when creating custom modal windows. Check generated HTML strings for missing accessible names on icon-only links.

## 2025-02-18 - Build Artifact Consistency
**Learning:** In hybrid projects (TS src -> JS dist), manual optimizations in the distribution files can be lost during build if not mirrored in source.
**Action:** Always check if a "refactor" of a distribution file (like adding performance caching) is actually just a manual hack that needs to be properly implemented in the source language (TypeScript) to persist.
