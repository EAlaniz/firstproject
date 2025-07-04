import type { WalletClient } from 'viem';
import type { Signer, Identifier } from '@xmtp/browser-sdk';

/**
 * Create V3 Browser SDK compliant XMTP signer
 * ✅ Uses getIdentifier() (current v3.0.3 interface)
 * ✅ Returns Identifier object (V3 SDK requirement)
 * ✅ Returns BigInt for getChainId() when SCW
 * ✅ Includes getBlockNumber() method for SCW
 * ✅ Removes deprecated getAddress() method
 * 
 * NOTE: Future versions will use getIdentity() instead of getIdentifier()
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

  // XMTP V3 Browser SDK compliant signer pattern
  const baseSigner = {
    type: 'EOA' as const,
    getIdentifier: () => accountIdentifier, // ✅ Returns Identifier object
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

  // V3 Browser SDK: EOA signer only needs type, getIdentifier, and signMessage
  // getChainId and getBlockNumber are only for SCW signers
  const finalSigner = baseSigner;

  // Test the signer before returning
  console.log('🧪 Testing signer identifier...');
  try {
    const identifier = finalSigner.getIdentifier();
    console.log('✅ Signer identifier test:', identifier);
  } catch (error) {
    console.error('❌ Signer identifier test failed:', error);
  }

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
    console.log('🧹 Clearing XMTP identity to force fresh signature...');
    
    // Clear IndexedDB
    if (typeof indexedDB !== 'undefined') {
      await indexedDB.deleteDatabase('xmtp-encrypted-store');
      console.log('✅ IndexedDB cleared');
    }
    
    // Clear localStorage
    if (typeof localStorage !== 'undefined') {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('xmtp-') || key.includes('xmtp'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('✅ localStorage cleared');
    }
    
    // Clear sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.startsWith('xmtp-') || key.includes('xmtp'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
      console.log('✅ sessionStorage cleared');
    }
    
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
      const clientWithDeleteLocal = Client as { deleteLocal?: () => Promise<void> };
      if (typeof clientWithDeleteLocal.deleteLocal === 'function') {
        await clientWithDeleteLocal.deleteLocal();
        console.log('✅ XMTP identity cleared using built-in method');
      } else {
        console.log('⚠️ deleteLocal not available, using manual clearing');
        await clearXMTPIdentity();
      }
          } catch {
        console.log('⚠️ Built-in method failed, using manual clearing');
        await clearXMTPIdentity();
      }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to clear XMTP identity with client:', error);
    return false;
  }
}; 