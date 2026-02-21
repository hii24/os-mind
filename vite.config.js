import { defineConfig } from 'vite';
import { resolve } from 'path';

// Custom plugin to ONLY inline CSS and keep JS out of index.html
function inlineCssPlugin() {
    return {
        name: 'inline-css',
        enforce: 'post',
        generateBundle(options, bundle) {
            let cssContent = '';
            for (const key of Object.keys(bundle)) {
                if (bundle[key].type === 'asset' && key.endsWith('.css')) {
                    cssContent += bundle[key].source;
                    delete bundle[key]; // Do not generate .css files
                }
            }
            for (const key of Object.keys(bundle)) {
                if (bundle[key].type === 'asset' && key.endsWith('.html')) {
                    const html = bundle[key].source;
                    // Inject gathered CSS right before </head>
                    bundle[key].source = html.replace(
                        /<\/head>/i,
                        `<style>${cssContent}</style></head>`
                    ).replace(/<link rel="stylesheet"[^>]*>/gi, '');
                }
            }
        }
    };
}

export default defineConfig({
    root: '.',
    plugins: [inlineCssPlugin()],
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
            },
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler',
            },
        },
    },
});
