/**
 * Fix for Coinbase Wallet RPC proxy issues
 * Ensures all requests use Base network instead of falling back to ethereum-mainnet
 */
export function setupCoinbaseWalletFix() {
  // Intercept Coinbase Wallet requests to ensure they use Base network
  if (typeof window !== 'undefined' && window.ethereum) {
    const originalRequest = window.ethereum.request;
    
    window.ethereum.request = async (args: { method: string; params?: unknown[] }) => {
      // Force Base network for chain-related requests
      if (args.method === 'eth_chainId') {
        console.log('🔧 Coinbase Wallet fix: Forcing Base chain ID');
        return '0x2105'; // Base mainnet chain ID
      }
      
      if (args.method === 'wallet_switchEthereumChain') {
        // Ensure we're switching to Base
        if (args.params && args.params[0] && (args.params[0] as { chainId?: string }).chainId !== '0x2105') {
          console.warn('⚠️ Attempting to switch to non-Base network, forcing Base');
          args.params[0] = { chainId: '0x2105' };
        }
      }
      
      // Log RPC requests for debugging
      if (args.method && !args.method.startsWith('wallet_')) {
        console.log('🔧 Coinbase Wallet RPC request:', args.method);
      }
      
      return originalRequest.call(window.ethereum, args);
    };
    
    console.log('✅ Coinbase Wallet RPC fix applied');
  }
}

/**
 * Additional fix for Coinbase Wallet SDK if used
 */
export function setupCoinbaseWalletSDKFix() {
  // If Coinbase Wallet SDK is loaded, configure it for Base
  if (typeof window !== 'undefined' && (window as unknown as { CoinbaseWalletSDK?: unknown }).CoinbaseWalletSDK) {
    try {
      const CoinbaseWalletSDK = (window as unknown as { CoinbaseWalletSDK: unknown }).CoinbaseWalletSDK;

      // Override the default configuration to include Base
      const originalConstructor = CoinbaseWalletSDK as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      (window as unknown as { CoinbaseWalletSDK: unknown }).CoinbaseWalletSDK = function(options: { rpc?: Record<string, string> }) {
        const rpcUrl = import.meta.env.VITE_RPC_URL;
        if (!rpcUrl) {
          console.error('❌ VITE_RPC_URL is required for Coinbase Wallet SDK');
          throw new Error('VITE_RPC_URL environment variable is required');
        }

        const enhancedOptions = {
          ...options,
          rpc: {
            ...options.rpc,
            8453: rpcUrl
          }
        };

        console.log('🔧 Coinbase Wallet SDK configured for Base network');
        return new originalConstructor(enhancedOptions);
      } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      
      console.log('✅ Coinbase Wallet SDK fix applied');
    } catch (error) {
      console.warn('⚠️ Coinbase Wallet SDK fix failed:', error);
    }
  }
} 