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
  console.log("Initializing WAGMI config with Base RPC URL:", "https://mainnet.base.org");
  
  return createConfig({
    chains: [base],
    connectors: [cbWalletConnector],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [base.id]: http("https://mainnet.base.org", {
        batch: {
          batchSize: 1024,
          wait: 16,
        },
      }),
    },
  });
}

export const config = getConfig();

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}