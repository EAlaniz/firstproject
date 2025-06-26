import { createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { coinbaseWallet } from 'wagmi/connectors'
import { http } from 'viem'

// Use the private QuickNode RPC URL - FIXED: use import.meta.env for Vite
const rpcUrl = import.meta.env.VITE_RPC_URL || 'https://flashy-convincing-paper.base-mainnet.quiknode.pro/fe55bc09278a1ccc534942fad989695b412ab4ea/'

console.log('🔧 Wagmi Config RPC URL:', rpcUrl);

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: 'farcaster-mini',
      appLogoUrl: 'https://www.move10k.xyz/10k-icon.png',
      jsonRpcUrl: rpcUrl, // ✅ MUST BE PROVIDED for Base network
    }),
  ],
  transports: {
    [base.id]: http(rpcUrl),
  },
  pollingInterval: 4000,
  ssr: false,
}) 