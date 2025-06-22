import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { config } from './wagmi';
import { AuthKitProvider } from '@farcaster/auth-kit';
import App from './App';
import './index.css';

const queryClient = new QueryClient();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AuthKitProvider
          config={{
            domain: 'move10k.xyz',
            redirectUrl: window.location.origin,
          }}
        >
          <OnchainKitProvider
            apiKey={import.meta.env.VITE_ONCHAINKIT_API_KEY}
            chain={base}
          >
            <App />
          </OnchainKitProvider>
        </AuthKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
