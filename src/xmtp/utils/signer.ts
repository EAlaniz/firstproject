import type { WalletClient } from 'viem';
import type { Signer, Identifier } from '@xmtp/browser-sdk';

/**
 * Create XMTP V3 3.0.3 compliant signer for EOA wallets
 * Follows official XMTP V3 browser-sdk 3.0.3 patterns
 */
export const createEOASigner = (walletClient: WalletClient): Signer => {
  if (!walletClient?.account?.address) {
    throw new Error('Invalid wallet client: missing account or address');
  }

  console.log('[XMTP] Creating EOA signer for address:', walletClient.account.address);

  return {
    type: 'EOA' as const,
    getIdentifier: (): Identifier => ({
      identifier: walletClient.account!.address.toLowerCase(),
      identifierKind: 'Ethereum' as const,
    }),
    signMessage: async (message: string): Promise<Uint8Array> => {
      try {
        console.log('[XMTP] Requesting signature for message:', message);
        
        const signature = await walletClient.signMessage({
          account: walletClient.account!.address,
          message,
        });
        
        // Convert hex signature to Uint8Array as XMTP V3 3.0.3 expects
        const signatureBytes = new Uint8Array(Buffer.from(signature.slice(2), 'hex'));
        console.log('[XMTP] Signature created successfully');
        
        return signatureBytes;
      } catch (error) {
        console.error('[XMTP] Signature failed:', error);
        throw error;
      }
    },
  };
};

/**
 * Validate XMTP V3 3.0.3 signer compliance
 */
export const validateSigner = async (signer: Signer): Promise<boolean> => {
  try {
    // Check signer type (EOA or SCW)
    if (!signer.type || !['EOA', 'SCW'].includes(signer.type)) {
      console.error('[XMTP] Invalid signer type:', signer.type);
      return false;
    }

    // Check required methods
    if (typeof signer.getIdentifier !== 'function') {
      console.error('[XMTP] Missing getIdentifier function');
      return false;
    }

    if (typeof signer.signMessage !== 'function') {
      console.error('[XMTP] Missing signMessage function');
      return false;
    }

    // For SCW signers, check additional requirements
    if (signer.type === 'SCW') {
      if (typeof signer.getChainId !== 'function') {
        console.error('[XMTP] SCW signer missing getChainId function');
        return false;
      }
      // getBlockNumber is optional for SCW
    }

    // Test getIdentifier (V3 3.0.3 supports both sync and async)
    const identifierResult = signer.getIdentifier();
    const identifier = identifierResult instanceof Promise ? await identifierResult : identifierResult;
    
    if (!identifier || !identifier.identifier || !identifier.identifierKind) {
      console.error('[XMTP] Invalid identifier returned by getIdentifier');
      return false;
    }

    if (identifier.identifierKind !== 'Ethereum') {
      console.error('[XMTP] Invalid identifier kind, must be "Ethereum"');
      return false;
    }

    console.log('[XMTP] Signer validation passed for V3 3.0.3');
    return true;
  } catch (error) {
    console.error('[XMTP] Signer validation failed:', error);
    return false;
  }
}; 