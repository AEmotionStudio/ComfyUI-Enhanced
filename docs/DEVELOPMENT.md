# Development Workflow

This document describes how to work on the ComfyUI-EnhancedLinksandNodes extension.

## Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- ComfyUI installation (for testing)

## Getting Started

```bash
# Install dependencies
pnpm install

# Run type checking
pnpm run type-check

# Run unit tests
pnpm run test

# Build for production
pnpm run build
```

## Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Watch mode - rebuilds on file changes |
| `pnpm build` | Build production files to `js/` |
| `pnpm test` | Run unit tests in watch mode |
| `pnpm test:run` | Run unit tests once |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm test:e2e` | Run Playwright browser tests |
| `pnpm type-check` | TypeScript type checking |
| `pnpm lint` | Run linting (type-check) |

## Project Structure

```
src/
├── core/           # Core configuration and types
│   ├── config.ts   # Constants (PHI, SACRED, defaults)
│   ├── state.ts    # Animation state management
│   ├── timing.ts   # Timing utilities
│   └── types.ts    # TypeScript type definitions
├── utils/          # Shared utilities
│   ├── colors.ts   # Color conversion and manipulation
│   ├── math.ts     # Math helpers
│   └── canvas.ts   # Canvas utilities
├── renderers/      # Rendering strategies
│   ├── link-renderers.ts
│   ├── marker-shapes.ts
│   └── static-renderers.ts
├── effects/        # Animation effects
│   ├── link-animations.ts
│   ├── node-animations.ts
│   └── completion.ts
├── ui/             # UI components
│   ├── settings.ts
│   ├── context-menu.ts
│   └── about-modal.ts
└── extensions/     # Entry points for ComfyUI
    ├── link-animations.ts
    └── node-animations.ts

tests/
├── unit/           # Vitest unit tests
└── e2e/            # Playwright browser tests

js/                 # Build output (consumed by ComfyUI)
```

## Development Workflow

1. **Make changes** in `src/` directory
2. **Run tests** with `pnpm test` to verify
3. **Build** with `pnpm build` to update `js/` output
4. **Test in ComfyUI** by refreshing the browser

### Using Watch Mode

For active development:

```bash
# Terminal 1: Watch for file changes and rebuild
pnpm dev

# Terminal 2: Watch for test file changes
pnpm test
```

## ComfyUI Integration

The extension is loaded by ComfyUI from the `js/` directory. The build process:

1. Compiles TypeScript from `src/extensions/*.ts`
2. Bundles all imports into single files
3. Outputs to `js/link_animations.js` and `js/node_animations.js`
4. Preserves external imports (`../../../scripts/app.js`, etc.)

### Testing in ComfyUI

1. Ensure ComfyUI is running at `http://localhost:8188`
2. Make changes and run `pnpm build`
3. Refresh ComfyUI in browser (Ctrl+Shift+R for hard refresh)
4. Verify changes in the UI

## Code Style

- TypeScript strict mode enabled
- Use named exports over default exports
- Document public functions with TSDoc comments
- Keep functions pure where possible
- Use descriptive variable names

## Adding New Features

1. Add types to `src/core/types.ts`
2. Implement in appropriate module
3. Add unit tests in `tests/unit/`
4. Export from entry point if needed
5. Build and test in ComfyUI
