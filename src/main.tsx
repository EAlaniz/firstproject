import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '../wagmi.config';
import { base } from 'wagmi/chains';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App';
// OnchainKit CSS loaded via HTML link tag to avoid Tailwind v3/v4 PostCSS conflict
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 1000,
    },
  },
});

// Ensure client-side requests to our serverless API use absolute URLs
// This fixes Base Preview loading where relative paths resolve against base.dev
if (typeof window !== 'undefined') {

  // Surface a clear warning in development if RPC URL is missing
  if (!import.meta.env.VITE_RPC_URL) {
    console.warn('[OnchainKit] VITE_RPC_URL is not set. Configure a Base RPC in your environment to avoid public endpoint fallbacks.');
  }

  // No iframe shims; rely on provider config only for Base-native behavior
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <OnchainKitProvider
            apiKey={import.meta.env.VITE_ONCHAINKIT_API_KEY || ''}
            chain={base}
            miniKit={{ 
              enabled: true,
              // Always provide an RPC URL to silence public-endpoint warnings
              rpcUrl: import.meta.env.VITE_RPC_URL || 'https://mainnet.base.org',
            }}
            config={{
              appearance: {
                mode: 'dark',
                theme: 'base',
                name: '10K',
              },
              // Disable EIP-6963 probing inside sandboxed mini app iframes
              wallet: {
                disableEIP6963: true,
              },
            }}
          >
            <App />
          </OnchainKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  </StrictMode>
);

// No manual readiness hooks; rely on MiniKit + OnchainKit per Base docs.
