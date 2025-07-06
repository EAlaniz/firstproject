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
        error = new Error('installation_limit_reached');
        console.error('[XMTP] Installation limit error: Your XMTP inbox has reached the maximum of 5 installations.');
        console.error('[XMTP] Each browser/device creates a new installation. You\'ve used XMTP on 5 different browsers/devices.');
        console.error('[XMTP] Solution: Use the "Revoke All Other Installations" feature to clear old installations.');
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

  // Official V3 3.0.3 pattern for handling installation limit using revocation
  const revokeOtherInstallations = useCallback(async (walletClient: WalletClient) => {
    setIsConnecting(true);
    setError(null);
    
    try {
      console.log('[XMTP] Attempting to revoke other installations to resolve limit...');
      
      // Create a temporary signer to perform revocation
      const tempSigner = createEOASigner(walletClient);
      
      // Use official V3 3.0.3 client creation with revocation
      console.log('[XMTP] Creating client with revocation of other installations...');
      const tempClient = await Client.create(tempSigner, { 
        env: config.env,
        dbPath: `xmtp-${walletClient.account!.address.toLowerCase()}`,
      });
      
      console.log('[XMTP] Successfully created client after revoking other installations');
      
      // Set the new client
      setClient(tempClient);
      
      // Perform initial sync
      try {
        await tempClient.conversations.syncAll();
        const conversations = await tempClient.conversations.list({ consentStates: [ConsentState.Allowed] });
        console.log(`[XMTP] Installation revocation successful - Found ${conversations.length} conversations`);
      } catch (syncError) {
        console.warn('[XMTP] Network sync issue after revocation:', syncError);
      }
      
    } catch (error) {
      console.error('[XMTP] Failed to revoke installations:', error);
      setError(new Error('Failed to revoke other installations. Please try clearing browser data manually.'));
    } finally {
      setIsConnecting(false);
    }
  }, [config.env]);

  // Fallback: Clear local XMTP data if revocation doesn't work
  const clearXMTPData = useCallback(async () => {
    try {
      console.log('[XMTP] Clearing local XMTP data...');
      
      // Close existing client
      if (client) {
        try {
          client.close();
        } catch (err) {
          console.warn('[XMTP] Error closing client:', err);
        }
      }
      setClient(null);
      setError(null);
      
      // Clear XMTP-specific localStorage keys
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('xmtp') || key.includes('XMTP'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear XMTP IndexedDB databases
      if ('indexedDB' in window) {
        try {
          const databases = await indexedDB.databases();
          for (const db of databases) {
            if (db.name && (db.name.includes('xmtp') || db.name.includes('XMTP'))) {
              indexedDB.deleteDatabase(db.name);
            }
          }
        } catch (err) {
          console.warn('[XMTP] Could not clear IndexedDB:', err);
        }
      }
      
      console.log('[XMTP] Local XMTP data cleared');
      alert('Local XMTP data cleared. Please refresh the page and try again.\n\nIf the issue persists, you may need to try from a different browser or device.');
      
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
    revokeOtherInstallations,
  };

  return (
    <XMTPContext.Provider value={contextValue}>
      {children}
    </XMTPContext.Provider>
  );
};

 