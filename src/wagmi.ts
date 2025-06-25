import { http, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet, metaMask } from 'wagmi/connectors';
import { ENV_CONFIG } from './constants';

export const config = createConfig({
  chains: [base],
  connectors: [
    metaMask(),
    coinbaseWallet({
      appName: '10K - Move. Earn. Connect.',
      appLogoUrl: 'https://www.move10k.xyz/10k-icon.png',
      jsonRpcUrl: ENV_CONFIG.RPC_URL,
      chainId: base.id,
    }),
  ],
  transports: {
    [base.id]: http(ENV_CONFIG.RPC_URL),
  },
});

// TypeScript module augmentation for Wagmi config
declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
