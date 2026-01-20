## 2025-02-18 - Vanilla JS Modal Focus
**Learning:** In vanilla JS modals created with `document.createElement`, calling `focus()` immediately after appending to DOM often fails. A small timeout (e.g., 100ms) or `requestAnimationFrame` is often needed to ensure the element is focusable.
**Action:** Always wrap initial focus logic in a timeout or RAF when building vanilla JS UI components.
