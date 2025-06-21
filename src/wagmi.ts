import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet } from "wagmi/connectors";

const config = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: "10K - Move. Earn. Connect.",
      preference: {
        options: "smartWalletOnly",
      },
    }),
  ],
  transports: {
    [base.id]: http('https://flashy-convincing-paper.base-mainnet.quiknode.pro/fe55bc09278a1ccc534942fad989695b412ab4ea/'),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}

export { config };