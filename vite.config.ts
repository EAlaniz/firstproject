import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'public/.well-known',
          dest: '.well-known',
        },
        {
          src: 'node_modules/@coinbase/onchainkit/dist/assets/style.css',
          dest: 'assets',
          rename: 'onchainkit.css',
        },
      ],
    }),
  ],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'esnext',
    minify: 'esbuild',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: [],
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        // Ensure proper module initialization order
        generatedCode: {
          constBindings: true, // Use const instead of var to prevent hoisting issues
        },
      },
      // Ensure proper tree-shaking and module resolution
      treeshake: {
        preset: 'recommended',
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react', 'workers'],
    include: ['protobufjs/minimal'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      'protobufjs/minimal': path.resolve(__dirname, 'node_modules/protobufjs/minimal.js'),
      'eventemitter3': path.resolve(__dirname, 'node_modules/eventemitter3/index.js'),
    },
  },
  // Farcaster-specific optimizations
  esbuild: {
    // Suppress specific warnings in Farcaster environment
    logOverride: {
      'this-is-undefined-in-esm': 'silent',
    },
  },
});
