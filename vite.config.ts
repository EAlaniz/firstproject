import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none'
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
