import { http, cookieStorage, createConfig, createStorage } from "wagmi";
import { base } from "wagmi/chains";
import { coinbaseWallet } from "wagmi/connectors";

const cbWalletConnector = coinbaseWallet({
  appName: "10K - Move. Earn. Connect.",
  preference: {
    options: "smartWalletOnly",
  },
});

export function getConfig() {
  console.log("Initializing WAGMI config with QuickNode RPC URL");
  
  return createConfig({
    chains: [base],
    connectors: [cbWalletConnector],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [base.id]: http('https://flashy-convincing-paper.base-mainnet.quiknode.pro/fe55bc09278a1ccc534942fad989695b412ab4ea/'),
    },
  });
}

export const config = getConfig();

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}