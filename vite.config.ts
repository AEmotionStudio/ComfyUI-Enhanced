import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        lib: {
            entry: {
                link_animations: resolve(__dirname, 'src/extensions/link-animations.ts'),
                node_animations: resolve(__dirname, 'src/extensions/node-animations.ts'),
            },
            formats: ['es'],
            fileName: (_, entryName) => `${entryName}.js`,
        },
        // Output to dist/ during development to preserve original js/ files
        // When migration is complete, change to 'js' and remove originals
        outDir: 'dist',
        emptyOutDir: true,
        minify: false, // Keep readable for debugging
        sourcemap: true,
        rollupOptions: {
            external: [
                // ComfyUI imports - these are resolved at runtime
                /^\.\.\/\.\.\/\.\.\/scripts\/.*/,
            ],
            output: {
                // Preserve the import paths for ComfyUI
                paths: {
                    '../../../scripts/app.js': '../../../scripts/app.js',
                    '../../../scripts/api.js': '../../../scripts/api.js',
                },
            },
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
});
