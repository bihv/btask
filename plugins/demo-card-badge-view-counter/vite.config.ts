import { defineConfig } from 'vite'

// Inline CSS injection plugin - injects CSS into the JS bundle at runtime
function cssInjectedByJsPlugin() {
    return {
        name: 'css-injected-by-js',
        apply: 'build' as const,
        enforce: 'post' as const,
        generateBundle(options: any, bundle: any) {
            // Find all CSS assets
            const cssAssets: string[] = [];
            const fileNames = Object.keys(bundle);
            for (const fileName of fileNames) {
                if (fileName.endsWith('.css')) {
                    cssAssets.push(bundle[fileName].source);
                    delete bundle[fileName];
                }
            }
            if (cssAssets.length === 0) return;

            // Find the JS entry and prepend CSS injection code
            for (const fileName of Object.keys(bundle)) {
                const chunk = bundle[fileName];
                if (chunk.type === 'chunk' && chunk.isEntry) {
                    const injection = `(function(){try{var s=document.createElement('style');s.textContent=\`${cssAssets.join('\n')}\`;document.head.appendChild(s)}catch(e){console.error('CSS injection failed',e)}})();\n`;
                    chunk.code = injection + chunk.code;
                }
            }
        }
    };
}

export default defineConfig({
    plugins: [cssInjectedByJsPlugin()],
    build: {
        lib: {
            entry: 'src/index.tsx',
            name: 'MelloPluginCardViewCounter',
            fileName: 'client',
            formats: ['iife']
        },
        outDir: 'dist'
    },
    define: {
        'process.env.NODE_ENV': '"production"'
    }
})
