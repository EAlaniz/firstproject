/// <reference types="vite/client" />

// Global declarations for Node.js polyfills
declare global {
  interface Window {
    Buffer: typeof Buffer;
    process: typeof process;
  }
}

export {};
