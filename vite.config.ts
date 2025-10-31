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
        {
          src: 'node_modules/@coinbase/onchainkit/dist/assets/style.css',
          dest: 'assets',
          rename: 'onchainkit.css',
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
    minify: 'esbuild', // Faster than terser, good enough for production
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: [],
      output: {
        manualChunks: (id) => {
          // Separate vendor chunks for better caching and smaller initial bundle
          if (id.includes('node_modules')) {
            if (id.includes('@coinbase/onchainkit')) {
              return 'onchainkit';
            }
            if (id.includes('wagmi') || id.includes('viem')) {
              return 'wagmi';
            }
            if (id.includes('@xmtp')) {
              return 'xmtp';
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            // All other node_modules go into vendor chunk
            return 'vendor';
          }
        },
      },
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
