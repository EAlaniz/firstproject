import type { WalletClient } from 'viem';
import type { Signer, Identifier } from '@xmtp/browser-sdk';

/**
 * Create a proper XMTP-compatible signer for Coinbase Wallet
 * This implements the exact interface that XMTP expects
 */
export const createAutoSigner = (walletClient: WalletClient): Signer => {
  if (!walletClient?.account?.address) {
    throw new Error('Invalid wallet client: missing account or address');
  }

  console.log('🔍 Creating XMTP-compatible signer for address:', walletClient.account.address);

  const accountIdentifier: Identifier = {
    identifier: walletClient.account.address.toLowerCase(),
    identifierKind: 'Ethereum',
  };

  // Create the base signer object
  const baseSigner = {
    type: 'EOA' as const,
    getIdentifier: () => accountIdentifier,
    signMessage: async (message: string): Promise<Uint8Array> => {
      try {
        console.log('🔐 XMTP requesting signature for message:', message);
        console.log('📝 Message to sign:', message);
        
        // Use the wallet client to sign the message
        const signature = await walletClient.signMessage({
          account: walletClient.account!.address,
          message,
        });
        
        // Convert hex signature to Uint8Array as XMTP expects
        const signatureBytes = new Uint8Array(Buffer.from(signature.slice(2), 'hex'));
        console.log('✅ Signature created successfully');
        
        return signatureBytes;
      } catch (error) {
        console.error('❌ Signature failed:', error);
        throw error;
      }
    },
  };

  // 🚨 CRITICAL FIX: Create the final signer with chain context
  const finalSigner = {
    ...baseSigner,
    // Add getChainId method to ensure XMTP uses correct chain context
    getChainId: async (): Promise<number> => {
      console.log('🔗 XMTP requesting chain ID, returning Base mainnet (8453)');
      return 8453; // Base mainnet chain ID
    },
    // Add getAddress method for compatibility
    getAddress: async (): Promise<string> => {
      return walletClient.account!.address;
    },
  };

  // Test the signer before returning
  console.log('🧪 Testing signer chain ID...');
  finalSigner.getChainId().then(chainId => {
    console.log('✅ Signer chain ID test:', chainId);
  }).catch(error => {
    console.error('❌ Signer chain ID test failed:', error);
  });

  return finalSigner as Signer;
};

/**
 * Validate a signer object
 */
export const validateSigner = async (signer: Signer): Promise<boolean> => {
  try {
    if (!signer.type || !['EOA', 'SCW'].includes(signer.type)) {
      console.error('Invalid signer type:', signer.type);
      return false;
    }

    if (typeof signer.getIdentifier !== 'function') {
      console.error('Missing getIdentifier function');
      return false;
    }

    if (typeof signer.signMessage !== 'function') {
      console.error('Missing signMessage function');
      return false;
    }

    // Test getIdentifier (handle both sync and async)
    const identifier = await signer.getIdentifier();
    if (!identifier || !identifier.identifier || !identifier.identifierKind) {
      console.error('Invalid identifier returned by getIdentifier');
      return false;
    }

    console.log('✅ Signer validation passed');
    return true;
  } catch (error) {
    console.error('❌ Signer validation failed:', error);
    return false;
  }
};

/**
 * Get signer information for debugging
 */
export const getSignerInfo = async (signer: Signer) => {
  try {
    const identifier = await signer.getIdentifier();
    const info = {
      type: signer.type,
      address: identifier.identifier,
      identifierKind: identifier.identifierKind,
    };
    
    console.log('📋 Signer Info:', info);
    return info;
  } catch (error) {
    console.error('Failed to get signer info:', error);
    return null;
  }
};

/**
 * 🚨 DEVELOPMENT ONLY: Clear XMTP identity to fix chain ID issues
 * WARNING: This will delete all local XMTP data and require re-initialization
 * Only use this if you're getting chain ID mismatch errors
 */
export const clearXMTPIdentity = async () => {
  try {
    console.log('🗑️ Clearing XMTP identity (development only)...');
    
    // Clear IndexedDB
    await indexedDB.deleteDatabase('xmtp-encrypted-store');
    console.log('✅ IndexedDB cleared');
    
    // Clear localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('xmtp-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('✅ localStorage cleared');
    
    console.log('✅ XMTP identity cleared successfully');
    console.log('⚠️ You will need to re-initialize XMTP on the next page load');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to clear XMTP identity:', error);
    return false;
  }
};

/**
 * 🚨 DEVELOPMENT ONLY: Clear XMTP identity using XMTP's built-in method
 * This is the recommended way to clear XMTP identity
 */
export const clearXMTPIdentityWithClient = async () => {
  try {
    console.log('🗑️ Clearing XMTP identity using built-in method...');
    
    // Import Client dynamically to avoid circular dependencies
    const { Client } = await import('@xmtp/browser-sdk');
    
    // Use XMTP's built-in method to clear local data
    // Note: deleteLocal might not be available in all versions, fallback to manual clearing
    try {
      if (typeof (Client as any).deleteLocal === 'function') {
        await (Client as any).deleteLocal();
        console.log('✅ XMTP identity cleared using built-in method');
      } else {
        console.log('⚠️ deleteLocal not available, using manual clearing');
        await clearXMTPIdentity();
      }
    } catch (clientError) {
      console.log('⚠️ Built-in method failed, using manual clearing');
      await clearXMTPIdentity();
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to clear XMTP identity with client:', error);
    return false;
  }
}; 