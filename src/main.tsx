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
              // Provide RPC URL to avoid public endpoint warnings (must be set via env)
              rpcUrl: import.meta.env.VITE_RPC_URL,
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

// Notify Base Mini App host that the app is ready to display
if (typeof window !== 'undefined') {
  const markReady = () => {
    try {
      (window as any).BaseMiniKit?.actions?.ready?.();
    } catch {/* no-op */}
  };
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    requestAnimationFrame(markReady);
  } else {
    window.addEventListener('DOMContentLoaded', () => requestAnimationFrame(markReady), { once: true });
  }
}
