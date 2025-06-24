import { detectEnvironment } from './environment';

export interface WalletCompatibilityInfo {
  isXMTPCompatible: boolean;
  walletType: 'smart-wallet' | 'extension-wallet' | 'mobile-wallet' | 'unknown';
  recommendedWallet: string;
  userMessage: string;
  canProceed: boolean;
}

export interface WalletDetectionResult {
  detectedWallets: string[];
  primaryWallet: string | null;
  isSmartWallet: boolean;
  isExtensionWallet: boolean;
  isMobileWallet: boolean;
}

/**
 * Detect what wallets are available in the current environment
 */
export const detectAvailableWallets = (): WalletDetectionResult => {
  const { isFarcasterMiniApp, platform } = detectEnvironment();
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  const detectedWallets: string[] = [];
  let primaryWallet: string | null = null;
  let isSmartWallet = false;
  let isExtensionWallet = false;
  let isMobileWallet = false;

  // Check for MetaMask
  if (typeof window !== 'undefined' && (window as any).ethereum?.isMetaMask) {
    detectedWallets.push('MetaMask');
    if (!primaryWallet) primaryWallet = 'MetaMask';
    isExtensionWallet = true;
  }

  // Check for Coinbase Wallet Extension
  if (typeof window !== 'undefined' && (window as any).ethereum?.isCoinbaseWallet) {
    detectedWallets.push('Coinbase Wallet Extension');
    if (!primaryWallet) primaryWallet = 'Coinbase Wallet Extension';
    isExtensionWallet = true;
  }

  // Check for other injected wallets
  if (typeof window !== 'undefined' && (window as any).ethereum && !isSmartWallet && !isExtensionWallet) {
    detectedWallets.push('Injected Wallet');
    if (!primaryWallet) primaryWallet = 'Injected Wallet';
  }

  // Detect Coinbase Smart Wallet (not XMTP compatible)
  if (typeof window !== 'undefined' && (window as any).coinbaseWalletExtension) {
    detectedWallets.push('Coinbase Smart Wallet');
    isSmartWallet = true;
  }

  // Mobile environment detection
  if (isMobile || isFarcasterMiniApp) {
    isMobileWallet = true;
    if (!primaryWallet) {
      primaryWallet = 'Coinbase Wallet (Mobile)';
      detectedWallets.push('Coinbase Wallet (Mobile)');
    }
  }

  return {
    detectedWallets,
    primaryWallet,
    isSmartWallet,
    isExtensionWallet,
    isMobileWallet
  };
};

/**
 * Check if the current wallet setup is compatible with XMTP
 */
export const checkXMTPCompatibility = (): WalletCompatibilityInfo => {
  const { isFarcasterMiniApp, platform } = detectEnvironment();
  const walletDetection = detectAvailableWallets();
  
  console.log('🔍 XMTP Compatibility Check:', {
    environment: { isFarcasterMiniApp, platform },
    walletDetection
  });

  // Smart wallets are NOT compatible with XMTP
  if (walletDetection.isSmartWallet) {
    return {
      isXMTPCompatible: false,
      walletType: 'smart-wallet',
      recommendedWallet: 'MetaMask or Coinbase Wallet Extension',
      userMessage: 'Coinbase Smart Wallets are not compatible with XMTP messaging. Please use MetaMask or Coinbase Wallet Extension for full functionality.',
      canProceed: false
    };
  }

  // Extension wallets are compatible
  if (walletDetection.isExtensionWallet) {
    return {
      isXMTPCompatible: true,
      walletType: 'extension-wallet',
      recommendedWallet: walletDetection.primaryWallet || 'Current Wallet',
      userMessage: 'Your wallet is compatible with XMTP messaging!',
      canProceed: true
    };
  }

  // Mobile wallets (Coinbase Wallet app) are compatible
  if (walletDetection.isMobileWallet) {
    return {
      isXMTPCompatible: true,
      walletType: 'mobile-wallet',
      recommendedWallet: 'Coinbase Wallet (Mobile)',
      userMessage: 'Mobile Coinbase Wallet is compatible with XMTP messaging!',
      canProceed: true
    };
  }

  // Unknown/No wallet detected
  return {
    isXMTPCompatible: false,
    walletType: 'unknown',
    recommendedWallet: 'MetaMask or Coinbase Wallet Extension',
    userMessage: 'No compatible wallet detected. Please install MetaMask or Coinbase Wallet Extension for XMTP messaging.',
    canProceed: false
  };
};

/**
 * Get user-friendly guidance based on current wallet setup
 */
export const getWalletGuidance = (): {
  title: string;
  message: string;
  actions: Array<{ label: string; url: string; type: 'primary' | 'secondary' }>;
} => {
  const compatibility = checkXMTPCompatibility();
  const { isFarcasterMiniApp, platform } = detectEnvironment();

  if (compatibility.isXMTPCompatible) {
    return {
      title: 'Wallet Ready for XMTP',
      message: compatibility.userMessage,
      actions: []
    };
  }

  if (compatibility.walletType === 'smart-wallet') {
    return {
      title: 'Smart Wallet Detected',
      message: 'Coinbase Smart Wallets cannot sign messages for XMTP. You\'ll need a different wallet for messaging features.',
      actions: [
        {
          label: 'Install MetaMask',
          url: 'https://metamask.io/download/',
          type: 'primary' as const
        },
        {
          label: 'Install Coinbase Wallet Extension',
          url: 'https://www.coinbase.com/wallet',
          type: 'secondary' as const
        }
      ]
    };
  }

  if (isFarcasterMiniApp || platform === 'farcaster' || platform === 'warpcast') {
    return {
      title: 'Mobile Wallet Required',
      message: 'For XMTP messaging on mobile, please use the Coinbase Wallet mobile app.',
      actions: [
        {
          label: 'Download Coinbase Wallet',
          url: 'https://www.coinbase.com/wallet',
          type: 'primary' as const
        }
      ]
    };
  }

  return {
    title: 'Wallet Required',
    message: 'Please install a compatible wallet to use XMTP messaging features.',
    actions: [
      {
        label: 'Install MetaMask',
        url: 'https://metamask.io/download/',
        type: 'primary' as const
      },
      {
        label: 'Install Coinbase Wallet Extension',
        url: 'https://www.coinbase.com/wallet',
        type: 'secondary' as const
      }
    ]
  };
}; 