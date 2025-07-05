import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Client } from '@xmtp/browser-sdk';
import type { WalletClient } from 'viem';
import { createAutoSigner } from '../utils/xmtpSigner';

// Official XMTP V3 types
interface XMTPContextValue {
  client: Client | null;
  isInitialized: boolean;
  isConnecting: boolean;
  error: Error | null;
  initialize: (walletClient: WalletClient) => Promise<void>;
  disconnect: () => Promise<void>;
  clearError: () => void;
}

const XMTPContext = createContext<XMTPContextValue | null>(null);

export { XMTPContext };

interface XMTPProviderProps {
  children: React.ReactNode;
}

export const SimpleXMTPProvider: React.FC<XMTPProviderProps> = ({ children }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize XMTP client using official V3 pattern
  const initialize = useCallback(async (walletClient: WalletClient) => {
    // Use refs to avoid dependency loops
    if (client || isConnecting) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      console.log('[XMTP] Initializing client...');
      
      // Create signer using official V3 pattern
      const signer = createAutoSigner(walletClient);
      
      // Use official Client.create method - SDK handles all persistence via IndexedDB
      const xmtpClient = await Client.create(signer, { env: 'production' });
      
      setClient(xmtpClient);
      console.log(`[XMTP] ✅ Client initialized successfully - Inbox: ${xmtpClient.inboxId}, Installation: ${xmtpClient.installationId}`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize XMTP');
      setError(error);
      console.error('[XMTP] ❌ Initialization failed:', error);
    } finally {
      setIsConnecting(false);
    }
  }, []); // Remove client and isConnecting from deps to prevent loops

  // Disconnect using official pattern
  const disconnect = useCallback(async () => {
    // Get current client state directly to avoid dependency loop
    setClient(currentClient => {
      if (!currentClient) return null;
      
      // Perform cleanup asynchronously
      (async () => {
        try {
          console.log('[XMTP] Disconnecting client...');
          // Use the correct cleanup method from the official SDK
          if (typeof ((currentClient as unknown) as { close?: () => Promise<void> }).close === 'function') {
            await ((currentClient as unknown) as { close: () => Promise<void> }).close();
          }
          console.log('[XMTP] ✅ Client disconnected successfully');
        } catch (err) {
          console.error('[XMTP] ❌ Disconnect failed:', err);
        }
      })();
      
      return null;
    });
    setError(null);
  }, []); // Remove client dependency to prevent loops

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  // Cleanup on unmount - use ref to avoid dependency loop
  const clientRef = useRef<Client | null>(null);
  
  // Update ref when client changes
  useEffect(() => {
    clientRef.current = client;
  }, [client]);
  
  // Cleanup on unmount without dependencies
  useEffect(() => {
    return () => {
      const currentClient = clientRef.current;
      if (currentClient) {
        // Cleanup without triggering state updates
        (async () => {
          try {
            if (typeof ((currentClient as unknown) as { close?: () => Promise<void> }).close === 'function') {
              await ((currentClient as unknown) as { close: () => Promise<void> }).close();
            }
          } catch (err) {
            console.error('[XMTP] Cleanup error:', err);
          }
        })();
      }
    };
  }, []); // No dependencies to prevent loops

  const contextValue: XMTPContextValue = {
    client,
    isInitialized: !!client,
    isConnecting,
    error,
    initialize,
    disconnect,
    clearError,
  };

  return (
    <XMTPContext.Provider value={contextValue}>
      {children}
    </XMTPContext.Provider>
  );
};

// Official hook pattern
export const useXMTP = (): XMTPContextValue => {
  const context = useContext(XMTPContext);
  if (!context) {
    throw new Error('useXMTP must be used within a SimpleXMTPProvider');
  }
  return context;
};

// Legacy export for backward compatibility
export const useSimpleXMTP = useXMTP;

