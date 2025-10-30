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
            miniKit={{ enabled: true }}
            config={{
              appearance: {
                mode: 'dark',
                theme: 'base',
                name: '10K',
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
