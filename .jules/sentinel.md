## 2025-05-15 - [Refactoring Duplicated XSS Vulnerability]
**Vulnerability:** DOM-based XSS via unsafe interpolation of `document.querySelector('style').textContent` into `iframe.srcdoc`.
**Learning:** Vulnerable code was duplicated across multiple files (`js/link_animations.js` and `js/node_animations.js`), increasing the attack surface and maintenance burden. Fixing it required refactoring into a shared utility (`js/utils.js`).
**Prevention:** Avoid interpolating DOM content directly into HTML strings for `srcdoc` or `innerHTML`. Use `textContent` assignment on created elements instead. Centralize shared UI components.

## 2025-05-15 - [Securing srcdoc Iframes with CSP]
**Vulnerability:** `iframe.srcdoc` inherits the parent origin, allowing scripts inside to access the parent DOM, but it also allows loading arbitrary external resources if not restricted.
**Learning:** Even for "static" content in `srcdoc`, adding a Content Security Policy (CSP) via `<meta http-equiv="Content-Security-Policy">` inside the HTML string provides Defense in Depth against future changes or injection vulnerabilities.
**Prevention:** Always include a restrictive CSP meta tag in the HTML content assigned to `srcdoc`.
