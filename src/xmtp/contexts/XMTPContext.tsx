import React, { createContext, useState, useCallback } from 'react';
import { 
  Client, 
  ConsentState, 
  ClientNotInitializedError,
  SignerUnavailableError,
  AccountAlreadyAssociatedError,
  InboxReassignError
} from '@xmtp/browser-sdk';
import type { WalletClient } from 'viem';
import type { XMTPContextValue, XMTPConfig } from '../types';
import { createEOASigner, validateSigner } from '../utils/signer';

export const XMTPContext = createContext<XMTPContextValue | null>(null);

interface XMTPProviderProps {
  children: React.ReactNode;
  config?: XMTPConfig;
}

export const XMTPProvider: React.FC<XMTPProviderProps> = ({ 
  children, 
  config = { env: 'production' } 
}) => {
  const [client, setClient] = useState<Client | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const initialize = useCallback(async (walletClient: WalletClient) => {
    if (client || isConnecting) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      console.log('[XMTP] Initializing client...');
      
      // Create signer using official XMTP V3 pattern
      const signer = createEOASigner(walletClient);
      
      // Validate signer before creating client
      const isValid = await validateSigner(signer);
      if (!isValid) {
        throw new Error('Invalid XMTP signer');
      }
      
      // Create XMTP client using official V3 3.0.3 pattern with enhanced options
      const xmtpClient = await Client.create(signer, { 
        env: config.env,
        // Use official V3 3.0.3 pattern for handling db path and encryption
        dbPath: `xmtp-${walletClient.account!.address.toLowerCase()}`,
      });
      
      setClient(xmtpClient);
      console.log('[XMTP] Client initialized successfully');
      console.log('[XMTP] Inbox ID:', xmtpClient.inboxId);
      console.log('[XMTP] Environment:', config.env);
      
      // Enhanced sync pattern for V3 3.0.3 to handle identity validation issues
      try {
        console.log('[XMTP] Starting conversation sync...');
        
        // Use official V3 3.0.3 comprehensive sync pattern including history
        await xmtpClient.conversations.syncAll();
        console.log('[XMTP] Full sync completed (conversations, messages, and history)');
        
        // Use official pattern: list only allowed conversations
        const conversations = await xmtpClient.conversations.list({ consentStates: [ConsentState.Allowed] });
        console.log(`[XMTP] Network sync successful - Found ${conversations.length} allowed conversations`);
      } catch (syncError) {
        console.warn('[XMTP] Network sync issue (may resolve automatically):', syncError);
        // Don't throw - sync issues often resolve themselves in V3
      }
    } catch (err) {
      let error: Error;
      
      // Handle specific XMTP V3 3.0.3 error types
      if (err instanceof ClientNotInitializedError) {
        error = new Error('XMTP client not properly initialized');
      } else if (err instanceof SignerUnavailableError) {
        error = new Error('Wallet signer is unavailable. Please connect your wallet.');
      } else if (err instanceof AccountAlreadyAssociatedError) {
        error = new Error('This account is already associated with a different inbox');
      } else if (err instanceof InboxReassignError) {
        error = new Error('Inbox reassignment error. Please try again.');
      } else {
        error = err instanceof Error ? err : new Error('Failed to initialize XMTP');
      }
      
      setError(error);
      console.error('[XMTP] Initialization failed:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [client, isConnecting, config.env]);

  const disconnect = useCallback(async () => {
    if (client) {
      try {
        // Note: client.close() might be synchronous in V3 3.0.3
        client.close();
        console.log('[XMTP] Client disconnected successfully');
      } catch (err) {
        console.error('[XMTP] Disconnect failed:', err);
      }
    }
    setClient(null);
    setError(null);
  }, [client]);

  const clearError = useCallback(() => setError(null), []);

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

 