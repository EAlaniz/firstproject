import { http, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';

// Detect if we're in a Farcaster mini app environment
const isFarcasterMiniApp = () => {
  return (
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
    window.location.hostname.includes('debug')
  );
};

export const config = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: '10K - Move. Earn. Connect.',
      appLogoUrl: 'https://www.move10k.xyz/10k-icon.png',
    }),
  ],
  transports: {
    [base.id]: http('https://flashy-convincing-paper.base-mainnet.quiknode.pro/fe55bc09278a1ccc534942fad989695b412ab4ea/'),
  },
});

// TypeScript module augmentation for Wagmi config
declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
