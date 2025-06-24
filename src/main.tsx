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
import App from './App';
import './index.css';

// Detect if we're in a Farcaster mini app environment
const isFarcasterMiniApp = () => {
  return (
    window.location.hostname.includes('farcaster.xyz') ||
    window.location.hostname.includes('warpcast.com') ||
    window.location.hostname.includes('wrpcd.net') ||
    window.location.search.includes('fid=') ||
    window.location.search.includes('farcaster=') ||
    window.navigator.userAgent.includes('Farcaster') ||
    window.navigator.userAgent.includes('Warpcast') ||
    // Add more specific detection for mini app preview
    window.location.search.includes('miniApp=true') ||
    window.location.pathname.includes('/miniapp') ||
    // Check for Farcaster mini app specific parameters
    window.location.search.includes('frame=') ||
    window.location.search.includes('embed=') ||
    // Check for mobile preview environments
    window.location.hostname.includes('preview') ||
    window.location.hostname.includes('debug')
  );
};

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
              rpcUrl: 'https://flashy-convincing-paper.base-mainnet.quiknode.pro/fe55bc09278a1ccc534942fad989695b412ab4ea/',
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
