/// <reference types="vite/client" />

// Window type extensions for browser APIs and third-party integrations
declare global {
  interface Window {
    // Farcaster Mini App detection
    farcaster?: {
      isMiniApp?: boolean;
    };

    // Ethereum provider (MetaMask, Coinbase Wallet, etc.)
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
      isCoinbaseWallet?: boolean;
    };

    // Coinbase Wallet SDK (for wallet fixes)
    CoinbaseWalletSDK?: unknown;
  }
}

export {};
