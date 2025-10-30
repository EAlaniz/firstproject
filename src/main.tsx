import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '../wagmi.config';
import { base } from 'wagmi/chains';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App';
import '@coinbase/onchainkit/styles.css'; // OnchainKit compiled styles - CRITICAL!
import './index.css';
import './styles/tokens.css';
import './styles/global.css';

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
