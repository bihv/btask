import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    build: {
        lib: {
            entry: 'src/index.tsx',
            name: 'MelloPluginCardVote',
            fileName: 'client',
            formats: ['iife']
        },
        outDir: 'dist',
        rollupOptions: {
            // Ensure we don't externalize react/antd if we want it self-contained,
            // OR externalize them if the host provides them. 
            // For now, bundling everything to be safe as iframe is isolated.
            external: [],
        }
    },
    define: {
        'process.env.NODE_ENV': '"production"'
    }
})
