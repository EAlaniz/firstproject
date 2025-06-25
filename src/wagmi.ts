import { http, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';
import { ENV_CONFIG } from './constants';

// Use the private QuickNode RPC URL
const rpcUrl = ENV_CONFIG.RPC_URL || 'https://flashy-convincing-paper.base-mainnet.quiknode.pro/fe55bc09278a1ccc534942fad989695b412ab4ea/';

export const config = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: '10K - Move. Earn. Connect.',
      appLogoUrl: 'https://www.move10k.xyz/10k-icon.png',
      jsonRpcUrl: rpcUrl,
      chainId: base.id,
    }),
  ],
  transports: {
    [base.id]: http(rpcUrl),
  },
});

// TypeScript module augmentation for Wagmi config
declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
