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

  const signer: Signer = {
    type: 'EOA',
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

  return signer;
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