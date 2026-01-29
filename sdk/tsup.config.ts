import { defineConfig } from 'tsup';

export default defineConfig([
  // Main SDK bundle
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ['react'],
    treeshake: true,
  },
  // React hooks bundle
  {
    entry: ['src/react/index.ts'],
    outDir: 'dist/react',
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    external: ['react'],
    treeshake: true,
  },
]);
