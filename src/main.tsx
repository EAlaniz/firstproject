import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi'; // ✅ FIXED: Import from wagmi library
import { wagmiConfig } from '../wagmi.config'; // ✅ Your custom config
import { base } from 'wagmi/chains';
import { AuthKitProvider } from '@farcaster/auth-kit';
import { ENV_CONFIG } from './constants';
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
            options: {
              timeout: 30000,
              enableLogging: true,
              rpcUrl: ENV_CONFIG.RPC_URL,
              chainId: base.id,
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
            apiKey={ENV_CONFIG.ONCHAINKIT_API_KEY || ''}
            chain={base}
            options={{
              timeout: 30000,
              enableLogging: true,
              rpcUrl: ENV_CONFIG.RPC_URL,
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
