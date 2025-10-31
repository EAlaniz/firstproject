import { createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { coinbaseWallet } from 'wagmi/connectors'
import { http } from 'viem'

// Use the private QuickNode RPC URL - MUST be set in environment variables
const rpcUrl = import.meta.env.VITE_RPC_URL;

if (!rpcUrl) {
  throw new Error('VITE_RPC_URL environment variable is required. Please set it in your .env file.');
}

console.log('🔧 Wagmi Config RPC URL:', rpcUrl ? 'Configured ✓' : 'Missing ✗');

// Check if running in Farcaster/Mini App environment
const isFarcaster = typeof window !== 'undefined' && (
  window.location.hostname.includes('warpcast.com') ||
  window.location.hostname.includes('farcaster.xyz') ||
  window.location.hostname.includes('farcaster.com') ||
  window.location.hostname.includes('base.org') ||
  window.self !== window.top // Check if embedded in iframe (mini app)
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
      // Farcaster/Mini App-specific options
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
  ssr: true,
  // Farcaster/Mini App-specific configuration
  ...(isFarcaster && {
    // Reduce polling to avoid excessive API calls
    pollingInterval: 8000,
    // Disable some features that might cause CSP issues
    batch: {
      multicall: false,
    },
  }),
}) 