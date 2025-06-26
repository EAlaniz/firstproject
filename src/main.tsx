import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '../wagmi.config';
import { base } from 'wagmi/chains';
import { AuthKitProvider } from '@farcaster/auth-kit';
import { http } from 'viem';
import { isFarcasterMiniApp } from './components/EnhancedWalletConnector';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 1000,
    },
  },
});

const RPC_URL =
  import.meta.env.VITE_RPC_URL ||
  'https://flashy-convincing-paper.base-mainnet.quiknode.pro/fe55bc09278a1ccc534942fad989695b412ab4ea/'

// Create viem transport instance for wagmi
const viemTransport = http(RPC_URL);

// Log RPC configuration for debugging
console.log('🔧 RPC Configuration:', {
  rpcUrl: RPC_URL,
  viemTransport: viemTransport,
  authKitConfig: {
    domain: 'www.move10k.xyz',
    redirectUrl: window.location.origin,
    chainId: base.id,
    rpcUrl: RPC_URL,
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AuthKitProvider
          config={{
            domain: 'www.move10k.xyz',
            redirectUrl: window.location.origin,
            chainId: base.id,
            rpcUrl: RPC_URL,
            options: {
              timeout: 30000,
              enableLogging: true,
            },
            miniApp: {
              enabled: isFarcasterMiniApp(),
              walletConnection: {
                type: 'native',
                fallback: 'popup',
              },
            },
          }}
        >
          <OnchainKitProvider
            apiKey={import.meta.env.VITE_ONCHAINKIT_API_KEY || ''}
            chain={base}
            options={{
              timeout: 30000,
              enableLogging: true,
              rpcUrl: RPC_URL,
              chainId: base.id,
              disablePopup: isFarcasterMiniApp(),
            }}
          >
            <App />
          </OnchainKitProvider>
        </AuthKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
