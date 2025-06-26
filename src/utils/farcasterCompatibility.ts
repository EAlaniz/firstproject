export const isFarcasterMiniApp = () => {
  return (
    window.location.hostname.includes('warpcast.com') ||
    window.location.hostname.includes('farcaster.xyz') ||
    window.location.hostname.includes('farcaster.com') ||
    (typeof window !== 'undefined' && 'farcaster' in window)
  );
};

export const farcasterCompatibility = {
  // Check if running in Farcaster environment
  isFarcasterMiniApp: () => {
    return (
      window.location.hostname.includes('warpcast.com') ||
      window.location.hostname.includes('farcaster.xyz') ||
      window.location.hostname.includes('farcaster.com') ||
      (typeof window !== 'undefined' && 'farcaster' in window)
    );
  },

  // Suppress WalletConnect explorer API errors in Farcaster
  suppressWalletConnectErrors: () => {
    if (farcasterCompatibility.isFarcasterMiniApp()) {
      // Override console.error to suppress WalletConnect CSP errors
      const originalError = console.error;
      console.error = (...args) => {
        const message = args.join(' ');
        if (
          message.includes('explorer-api.walletconnect.com') ||
          message.includes('Content Security Policy') ||
          message.includes('Failed to fetch') ||
          message.includes('Refused to connect')
        ) {
          // Suppress these specific errors in Farcaster
          console.warn('Suppressed WalletConnect error in Farcaster environment:', message);
          return;
        }
        originalError.apply(console, args);
      };
    }
  },

  // Handle SVG attribute warnings
  fixSvgAttributes: () => {
    if (farcasterCompatibility.isFarcasterMiniApp()) {
      // Override console.error to suppress SVG attribute warnings
      const originalError = console.error;
      console.error = (...args) => {
        const message = args.join(' ');
        if (message.includes('Expected length') && message.includes('svg')) {
          // Suppress SVG attribute warnings
          console.warn('Suppressed SVG attribute warning in Farcaster environment:', message);
          return;
        }
        originalError.apply(console, args);
      };
    }
  },

  // Handle Coinbase Wallet 400 errors (expected in Farcaster)
  suppressCoinbaseErrors: () => {
    if (farcasterCompatibility.isFarcasterMiniApp()) {
      // Override console.error to suppress Coinbase 400 errors
      const originalError = console.error;
      console.error = (...args) => {
        const message = args.join(' ');
        if (
          message.includes('chain-proxy.wallet.coinbase.com') ||
          message.includes('400') ||
          message.includes('client.warpcast.com/v2/onboarding-state')
        ) {
          // Suppress Coinbase and Warpcast API errors in Farcaster
          console.warn('Suppressed expected API error in Farcaster environment:', message);
          return;
        }
        originalError.apply(console, args);
      };
    }
  },

  // Initialize all Farcaster compatibility fixes
  init: () => {
    farcasterCompatibility.suppressWalletConnectErrors();
    farcasterCompatibility.fixSvgAttributes();
    farcasterCompatibility.suppressCoinbaseErrors();
    
    if (farcasterCompatibility.isFarcasterMiniApp()) {
      console.log('🌐 Farcaster Mini App compatibility mode enabled');
      console.log('📱 Environment: Farcaster Mini App');
      console.log('🔧 Suppressing expected CSP and API errors');
    } else {
      console.log('🖥️ Environment: Standard Web App');
    }
  }
}; 