## 2024-05-23 - Settings Access in Render Loops
**Learning:** Accessing settings (e.g., `app.ui.settings.getSettingValue`) inside render loops (like `drawConnections`) creates significant overhead, especially when doing string lookups or array searches for every entity every frame.
**Action:** Cache setting values at the beginning of the render frame or function and pass them into loops or helper functions. Avoid calling configuration getters repeatedly for invariant data during a frame.
