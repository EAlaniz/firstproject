import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
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
      ],
    }),
    nodePolyfills({
      protocolImports: true,
      globals: {
        Buffer: true,
        process: true,
      },
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
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: [],
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react', 'workers', '@xmtp/browser-sdk'],
    include: ['buffer', 'protobufjs/minimal'],
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
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
