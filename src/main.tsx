// Polyfills for Node.js globals needed by XMTP
import { Buffer } from 'buffer';
import process from 'process';

// Make Buffer and process available globally
window.Buffer = Buffer;
window.process = process;

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { config } from './wagmi';
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
    <WagmiProvider config={config}>
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
              // Disable popup in mini app environment
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
