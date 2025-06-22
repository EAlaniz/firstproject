import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-frame-html',
      writeBundle() {
        // Copy frame.html to dist directory
        const framePath = resolve(__dirname, 'frame.html');
        const distFramePath = resolve(__dirname, 'dist', 'frame.html');
        
        if (existsSync(framePath)) {
          copyFileSync(framePath, distFramePath);
          console.log('✅ Copied frame.html to dist directory');
        }
      },
    },
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
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
