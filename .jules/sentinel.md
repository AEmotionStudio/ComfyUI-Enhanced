## 2025-05-15 - [Refactoring Duplicated XSS Vulnerability]
**Vulnerability:** DOM-based XSS via unsafe interpolation of `document.querySelector('style').textContent` into `iframe.srcdoc`.
**Learning:** Vulnerable code was duplicated across multiple files (`js/link_animations.js` and `js/node_animations.js`), increasing the attack surface and maintenance burden. Fixing it required refactoring into a shared utility (`js/utils.js`).
**Prevention:** Avoid interpolating DOM content directly into HTML strings for `srcdoc` or `innerHTML`. Use `textContent` assignment on created elements instead. Centralize shared UI components.

## 2025-05-15 - [Securing srcdoc Iframes with CSP]
**Vulnerability:** `iframe.srcdoc` inherits the parent origin, allowing scripts inside to access the parent DOM, but it also allows loading arbitrary external resources if not restricted.
**Learning:** Even for "static" content in `srcdoc`, adding a Content Security Policy (CSP) via `<meta http-equiv="Content-Security-Policy">` inside the HTML string provides Defense in Depth against future changes or injection vulnerabilities.
**Prevention:** Always include a restrictive CSP meta tag in the HTML content assigned to `srcdoc`.

## 2025-05-15 - [Nonce-based CSP for Dynamic Iframes]
**Vulnerability:** Use of `script-src 'unsafe-inline'` in `srcdoc` iframe CSP allowed potential XSS if attacker could inject script tags into the generated HTML.
**Learning:** For client-side generated iframes (like `srcdoc`), we can generate a cryptographic nonce in JavaScript (`crypto.randomUUID`) and inject it into both the CSP meta tag and the script tag, completely removing the need for `unsafe-inline` even for inline scripts.
**Prevention:** Use `nonce-${generatedNonce}` in CSP `script-src` and add `nonce="${generatedNonce}"` to inline scripts instead of using `'unsafe-inline'`.
