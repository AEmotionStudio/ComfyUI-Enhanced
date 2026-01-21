## 2024-05-23 - Settings Access in Render Loops
**Learning:** Accessing settings (e.g., `app.ui.settings.getSettingValue`) inside render loops (like `drawConnections`) creates significant overhead, especially when doing string lookups or array searches for every entity every frame.
**Action:** Cache setting values at the beginning of the render frame or function and pass them into loops or helper functions. Avoid calling configuration getters repeatedly for invariant data during a frame.

## 2024-05-24 - Bezier Angle Calculation
**Learning:** `computeBezierAngle` was using an expensive sampling method (2x `computeBezierPoint` calls) which created overhead in hot loops like link rendering.
**Action:** Replaced with analytical derivative calculation (O(1)) which is faster and more precise. Always prefer analytical solutions over sampling for geometric calculations in render loops.
