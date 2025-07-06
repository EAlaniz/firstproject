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
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      // Handle specific XMTP V3 3.0.3 error types
      if (err instanceof ClientNotInitializedError) {
        error = new Error('XMTP client not properly initialized');
      } else if (err instanceof SignerUnavailableError) {
        error = new Error('Wallet signer is unavailable. Please connect your wallet.');
      } else if (err instanceof AccountAlreadyAssociatedError) {
        error = new Error('This account is already associated with a different inbox');
      } else if (err instanceof InboxReassignError) {
        error = new Error('Inbox reassignment error. Please try again.');
      } else if (errorMessage.includes('already registered 5/5 installations')) {
        // Handle installation limit error with official V3 3.0.3 solution
        error = new Error('XMTP installation limit reached (5/5). This typically happens when you\'ve used XMTP on multiple devices/browsers. Clear your browser data or try a different browser to create a new installation.');
        console.error('[XMTP] Installation limit error details:', errorMessage);
        console.error('[XMTP] Solution: Clear browser data, localStorage, and indexedDB for this domain, then try again.');
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

  // Official V3 3.0.3 pattern for clearing XMTP data when installation limit reached
  const clearXMTPData = useCallback(async () => {
    try {
      console.log('[XMTP] Clearing XMTP data to resolve installation limit...');
      
      // Clear client first
      if (client) {
        try {
          client.close();
        } catch (err) {
          console.warn('[XMTP] Error closing client:', err);
        }
      }
      setClient(null);
      setError(null);
      
      // Clear localStorage entries related to XMTP
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('xmtp') || key.includes('XMTP'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear IndexedDB databases (XMTP uses IndexedDB for local storage)
      if ('indexedDB' in window) {
        try {
          // Get list of databases and clear XMTP-related ones
          const databases = await indexedDB.databases();
          for (const db of databases) {
            if (db.name && (db.name.includes('xmtp') || db.name.includes('XMTP'))) {
              console.log('[XMTP] Deleting IndexedDB database:', db.name);
              indexedDB.deleteDatabase(db.name);
            }
          }
        } catch (err) {
          console.warn('[XMTP] Could not clear IndexedDB:', err);
        }
      }
      
      console.log('[XMTP] XMTP data cleared. Please refresh the page and try initializing XMTP again.');
      
      // Show user a clear message
      alert('XMTP data has been cleared to resolve the installation limit. Please refresh the page and try connecting to XMTP again.');
      
    } catch (error) {
      console.error('[XMTP] Error clearing XMTP data:', error);
    }
  }, [client]);

  const contextValue: XMTPContextValue = {
    client,
    isInitialized: !!client,
    isConnecting,
    error,
    initialize,
    disconnect,
    clearError,
    clearXMTPData,
  };

  return (
    <XMTPContext.Provider value={contextValue}>
      {children}
    </XMTPContext.Provider>
  );
};

 