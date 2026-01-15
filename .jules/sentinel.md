## 2025-05-15 - [Refactoring Duplicated XSS Vulnerability]
**Vulnerability:** DOM-based XSS via unsafe interpolation of `document.querySelector('style').textContent` into `iframe.srcdoc`.
**Learning:** Vulnerable code was duplicated across multiple files (`js/link_animations.js` and `js/node_animations.js`), increasing the attack surface and maintenance burden. Fixing it required refactoring into a shared utility (`js/utils.js`).
**Prevention:** Avoid interpolating DOM content directly into HTML strings for `srcdoc` or `innerHTML`. Use `textContent` assignment on created elements instead. Centralize shared UI components.
