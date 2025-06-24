/// <reference types="vite/client" />

// Environment variables
interface ImportMetaEnv {
  readonly VITE_RPC_URL?: string;
  readonly VITE_INFURA_URL?: string;
  readonly VITE_XMTP_ENV?: string;
  readonly VITE_STEP_TRACKER_CONTRACT?: string;
  readonly VITE_ONCHAINKIT_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Global declarations for Node.js polyfills
declare global {
  interface Window {
    Buffer: typeof Buffer;
    process: typeof process;
    farcaster?: {
      version?: string;
      getProvider?: () => Promise<any>;
    };
    warpcast?: {
      version?: string;
      getProvider?: () => Promise<any>;
    };
  }
}

export {};
