import { defineConfig } from 'vite'

export default defineConfig({
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
