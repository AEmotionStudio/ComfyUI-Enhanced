# Changelog

All notable changes to this project will be documented in this file.

## [2.0.1] - 2025-03-24

### Fixed
- **Registry Publish** — fixed node ID casing mismatch preventing ComfyUI Registry updates
- **Gitignore** — fixed patterns for `docs/` files, removed tracked images folder
- **Preview Images** — moved to GitHub Releases CDN for faster loading

---

## [2.0.0] - 2025-03-24

### ✨ Major Rewrite — TypeScript Architecture

The entire extension has been rewritten from ~7,000 lines of JavaScript into a modular, type-safe TypeScript codebase.

### Added
- **Sidebar Settings Panel** — all link and node settings are now adjustable live from a dedicated sidebar panel with instant visual preview
- **Reset to Defaults** — one-click reset buttons for both link and node settings
- **Independent Particles** — particles can now be enabled as a standalone feature, independent of node animation style selection
- **Batched Link Rendering** — high-performance `drawConnections` render queue replaces per-link `drawLink` for reduced canvas state changes
- **Link Transition Manager** — spring physics-based smooth transitions when switching between static link modes
- **60+ Registered Settings** — all settings are properly registered with ComfyUI's settings system
- **5 Text Animation Styles** — neon, cyberpunk, retro, pulse, minimal
- **6 Particle Color Modes** — default, rainbow, complementary, energy, quantum, aurora

### Fixed
- **Console spam** — eliminated 125,000+ deprecation warnings per second caused by `getSettingValue()` using deprecated 2-argument signature
- **TypeScript strictness** — resolved all literal type narrowing issues with explicit generic type annotations

### Changed  
- **Default Settings** — node animations, particles, link shadows, and marker shadows are now **off by default** for a cleaner initial experience
- **Modular Architecture** — code is organized into `renderers/`, `effects/`, `utils/`, `core/`, `sidebar/`, and `ui/` directories
- **Node Effects Fidelity** — all 4 node effects (Gentle Pulse, Neon Nexus, Cosmic Ripple, Flower of Life) faithfully ported line-by-line from original JS

### Technical
- **Build**: Vite/TypeScript producing 3 optimized chunks (~150KB total)
- **Modules**: 22 TypeScript modules
- **Zero build errors**

---

## [1.0.2] - 2024-03-20

### Added
- **Link Animations**: 9 Unique Animation Styles including Classic Flow, Sacred Flow, and more.
- **Node Animations**: 4 Node Animation Styles including Gentle Pulse and Neon Nexus.
- **Advanced Customization**: Extensive control over colors, markers, styles, and performance.
- **Performance Settings**: Options for static mode, quality control, and pause during render.
- **Text Visibility Tool**: Enhanced text animation for nodes.
- **End-of-Render Animation**: Special effects upon workflow completion.
