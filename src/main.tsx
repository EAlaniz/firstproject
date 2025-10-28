import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '../wagmi.config';
import { base } from 'wagmi/chains';
import { AuthKitProvider } from '@farcaster/auth-kit';
import { http } from 'viem';
import { isFarcasterMiniApp, farcasterCompatibility } from './utils/farcasterCompatibility';
import { setupCoinbaseWalletFix, setupCoinbaseWalletSDKFix } from './utils/coinbaseWalletFix';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App';
import './index.css';
import './styles/design-system.css';
import './styles/refined-design.css';

// Initialize Farcaster compatibility fixes early
farcasterCompatibility.init();

// NEW: Setup Coinbase Wallet fix
setupCoinbaseWalletFix();
setupCoinbaseWalletSDKFix();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 1000,
    },
  },
});

const RPC_URL = import.meta.env.VITE_RPC_URL || (() => {
  if (import.meta.env.PROD) {
    throw new Error('VITE_RPC_URL environment variable is required in production');
  }
  console.warn('⚠️ VITE_RPC_URL not set, using public Base RPC endpoint');
  return 'https://mainnet.base.org';
})();

// Create viem transport instance for wagmi
const viemTransport = http(RPC_URL);

// Log RPC configuration for debugging
console.log('🔧 RPC Configuration:', {
  rpcUrl: RPC_URL ? 'Configured ✓' : 'Missing ✗',
  viemTransport: viemTransport,
  authKitConfig: {
    domain: 'www.move10k.xyz',
    redirectUrl: window.location.origin,
    chainId: base.id,
    viemTransport: viemTransport,
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <AuthKitProvider
            config={{
              domain: 'www.move10k.xyz',
              redirectUrl: window.location.origin,
              chainId: base.id,
              viemTransport: viemTransport,
              options: {
                timeout: 30000,
                enableLogging: true,
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
                rpcUrl: RPC_URL,
                chainId: base.id,
                disablePopup: isFarcasterMiniApp(),
              }}
            >
              <App />
            </OnchainKitProvider>
          </AuthKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  </StrictMode>
);
