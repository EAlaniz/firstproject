import { createConfig, configureChains } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';

const { chains, publicClient } = configureChains(
  [base],
  [
    jsonRpcProvider({
      rpc: () => ({
        http: 'https://flashy-convincing-paper.base-mainnet.quiknode.pro/fe55bc09278a1ccc534942fad989695b412ab4ea/',
      }),
    }),
  ] // <-- This closing bracket was missing
);

export const config = createConfig({
  autoConnect: true,
  connectors: [
    coinbaseWallet({
      chains,
      appName: '10K - Move. Earn. Connect.',
    }),
  ],
  publicClient,
});
