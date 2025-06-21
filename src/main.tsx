import { StrictMode } from 'react';
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

// Get the current origin for development or production
const currentOrigin = window.location.origin;
const isDevelopment = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <AuthKitProvider config={{ 
            domain: isDevelopment ? 'localhost:5173' : 'move10k.xyz', 
            redirectUrl: currentOrigin 
          }}>
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
} else {
  throw new Error("Root element not found");
}