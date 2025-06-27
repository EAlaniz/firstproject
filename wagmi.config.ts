import { createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { coinbaseWallet } from 'wagmi/connectors'
import { http } from 'viem'

// Use the private QuickNode RPC URL - FIXED: use import.meta.env for Vite
const rpcUrl = import.meta.env.VITE_RPC_URL || 'https://flashy-convincing-paper.base-mainnet.quiknode.pro/fe55bc09278a1ccc534942fad989695b412ab4ea/'

console.log('🔧 Wagmi Config RPC URL:', rpcUrl);

// Check if running in Farcaster environment
const isFarcaster = typeof window !== 'undefined' && (
  window.location.hostname.includes('warpcast.com') ||
  window.location.hostname.includes('farcaster.xyz') ||
  window.location.hostname.includes('farcaster.com')
);

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: '10K - Move. Earn. Connect.',
      appLogoUrl: 'https://www.move10k.xyz/10k-icon.png',
      jsonRpcUrl: rpcUrl, // ✅ MUST BE PROVIDED for Base network
      // FIXED: Add explicit chain configuration to prevent ethereum-mainnet fallback
      chainId: 8453, // Base mainnet
      // Farcaster-specific options
      ...(isFarcaster && {
        // Disable WalletConnect explorer API calls in Farcaster
        disableExplorer: true,
        // Use simpler connection flow
        overrideIsMetaMask: false,
      }),
    }),
  ],
  transports: {
    [base.id]: http(rpcUrl),
  },
  pollingInterval: 4000,
  ssr: false,
  // Farcaster-specific configuration
  ...(isFarcaster && {
    // Reduce polling to avoid excessive API calls
    pollingInterval: 8000,
    // Disable some features that might cause CSP issues
    batch: {
      multicall: false,
    },
  }),
}) 