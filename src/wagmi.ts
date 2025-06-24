import { http, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet, metaMask, injected } from 'wagmi/connectors';

// Get RPC URL from environment or use fallback
const getRpcUrl = () => {
  // Check for environment variable first
  const envRpcUrl = import.meta.env.VITE_RPC_URL || import.meta.env.VITE_INFURA_URL;
  if (envRpcUrl) {
    return envRpcUrl;
  }
  
  // Fallback to your existing QuickNode URL
  return 'https://flashy-convincing-paper.base-mainnet.quiknode.pro/fe55bc09278a1ccc534942fad989695b412ab4ea/';
};

// Detect if we're in a Farcaster mini app environment
const isFarcasterMiniApp = () => {
  return (
    !!(window as any)?.farcaster?.version ||
    !!(window as any)?.warpcast?.version ||
    window.location.hostname.includes('farcaster.xyz') ||
    window.location.hostname.includes('warpcast.com') ||
    window.location.hostname.includes('wrpcd.net') ||
    window.location.search.includes('fid=') ||
    window.location.search.includes('farcaster=') ||
    window.navigator.userAgent.includes('Farcaster') ||
    window.navigator.userAgent.includes('Warpcast') ||
    // Add more specific detection for mini app preview
    window.location.search.includes('miniApp=true') ||
    window.location.pathname.includes('/miniapp') ||
    // Check for Farcaster mini app specific parameters
    window.location.search.includes('frame=') ||
    window.location.search.includes('embed=') ||
    // Check for mobile preview environments
    window.location.hostname.includes('preview') ||
    window.location.hostname.includes('debug') ||
    // Check for iframe context
    window.self !== window.top
  );
};

// Detect if we're on mobile
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Get appropriate connectors based on environment
const getConnectors = () => {
  const isMiniApp = isFarcasterMiniApp();
  const isMobileDevice = isMobile();
  
  console.log('🔍 Wallet Environment Detection:', {
    isMiniApp,
    isMobileDevice,
    userAgent: navigator.userAgent
  });

  // For Farcaster mini apps and mobile, use Coinbase Wallet (not smart wallet)
  if (isMiniApp || isMobileDevice) {
    return [
      coinbaseWallet({
        appName: '10K - Move. Earn. Connect.',
        appLogoUrl: 'https://www.move10k.xyz/10k-icon.png',
      }),
      // Fallback to injected for other mobile wallets
      injected(),
    ];
  }

  // For desktop/URL, prioritize XMTP-compatible wallets
  return [
    // MetaMask - fully XMTP compatible
    metaMask(),
    // Coinbase Wallet Extension - XMTP compatible
    coinbaseWallet({
      appName: '10K - Move. Earn. Connect.',
      appLogoUrl: 'https://www.move10k.xyz/10k-icon.png',
    }),
    // Injected for other browser extensions
    injected(),
  ];
};

export const config = createConfig({
  chains: [base],
  connectors: getConnectors(),
  transports: {
    [base.id]: http(getRpcUrl()),
  },
});

// TypeScript module augmentation for Wagmi config
declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
