import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MiniKitProvider } from '@coinbase/onchainkit/minikit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '../wagmi.config';
import { base } from 'wagmi/chains';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App';
import './index.css';
import './styles/tokens.css';
import './styles/global.css';
import './styles/onchainkit-overrides.css';

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
          <MiniKitProvider
            apiKey={import.meta.env.VITE_ONCHAINKIT_API_KEY || ''}
            chain={base}
            config={{
              appearance: {
                mode: 'dark',
                theme: 'base',
                name: '10K',
              },
            }}
          >
            <App />
          </MiniKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  </StrictMode>
);
