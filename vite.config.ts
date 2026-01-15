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
        // Output to js/ for ComfyUI consumption
        outDir: 'js',
        emptyOutDir: true,
        minify: false, // Keep readable for debugging
        sourcemap: true,
        rollupOptions: {
            external: [
                // ComfyUI imports - these are resolved at runtime
                /^\/scripts\/.*/,
            ],
            output: {
                // Preserve the import paths for ComfyUI
                paths: {
                    '/scripts/app.js': '/scripts/app.js',
                    '/scripts/api.js': '/scripts/api.js',
                },
                chunkFileNames: 'chunks/[name]-[hash].js',
            },
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
});
