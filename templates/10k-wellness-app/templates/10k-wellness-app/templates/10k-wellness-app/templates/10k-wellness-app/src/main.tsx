import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { Buffer } from 'buffer';
import { config } from './wagmi';
import App from './App';
import './index.css';

// Polyfill Buffer for browser compatibility with XMTP - must be set before any other imports
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
  (globalThis as any).Buffer = (globalThis as any).Buffer || Buffer;
}

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={import.meta.env.VITE_ONCHAINKIT_API_KEY}
          chain={base}
        >
          <App />
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);