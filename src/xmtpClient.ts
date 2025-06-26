import { Client } from '@xmtp/browser-sdk';
import { createAutoSigner, validateSigner, getSignerInfo } from './utils/xmtpSigner';
import { base } from 'wagmi/chains';

let xmtpClient: Client | null = null;

// Database encryption key for the local database (required for V3)
const databaseEncryptionKey = new Uint8Array([
  233, 120, 198, 96, 154, 65, 132, 17, 132, 96, 250, 40, 103, 35, 125, 64,
  166, 83, 208, 224, 254, 44, 205, 227, 175, 49, 234, 129, 74, 252, 135, 145,
]);

// RPC URL for Base network
const BASE_RPC_URL = process.env.VITE_RPC_URL || 'https://flashy-convincing-paper.base-mainnet.quiknode.pro/fe55bc09278a1ccc534942fad989695b412ab4ea/';

export interface XMTPClientConfig {
  walletClient: any;
  env?: 'production' | 'local' | 'dev';
}

export interface XMTPClientStatus {
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
  status: string;
}

/**
 * Create a proper XMTP signer following the documentation
 * This function creates the appropriate signer (EOA or SCW) based on the wallet type
 */
export async function createXMTPSigner(walletClient: any) {
  try {
    console.log('🔧 Creating XMTP signer for wallet client:', {
      address: walletClient.account?.address,
      chainId: walletClient.chain?.id,
      connector: walletClient.connector?.id
    });

    // Use our auto-detection function to create the appropriate signer
    const signer = createAutoSigner(walletClient);
    
    // Validate the signer
    const isValid = await validateSigner(signer);
    if (!isValid) {
      throw new Error('Invalid signer created');
    }

    // Get signer info for debugging
    await getSignerInfo(signer);
    
    console.log('✅ XMTP signer created successfully');
    return signer;
  } catch (error) {
    console.error('❌ Failed to create XMTP signer:', error);
    throw error;
  }
}

export async function initXMTP(walletClient: any) {
  try {
    console.log('🚀 Initializing XMTP V3 client...');
    
    // Validate wallet client
    if (!walletClient || !walletClient.account || !walletClient.account.address) {
      throw new Error('Invalid wallet client: missing account or address');
    }
    
    console.log('✅ Wallet client validated:', {
      address: walletClient.account.address,
      chainId: walletClient.chain?.id
    });

    // Create the XMTP signer
    console.log('🔧 Creating XMTP signer...');
    const signer = await createXMTPSigner(walletClient);
    
    console.log('🔄 Creating XMTP client with signer...');
    console.log('📝 Expected signature message format: "XMTP : Authenticate to inbox"');
    console.log('⏱️  This may take up to 60 seconds while waiting for your signature...');
    
    // Initialize client with our custom signer
    const createPromise = Client.create(signer, { 
      env: 'production'
    });
    
    console.log('✅ Client.create() promise created, waiting for signature...');
    
    // Add timeout wrapper to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('XMTP client creation timed out after 60 seconds')), 60000);
    });
    
    console.log('🏁 Starting Promise.race between Client.create() and timeout...');
    
    const client = await Promise.race([createPromise, timeoutPromise]) as Client;
    
    console.log('🎉 XMTP client created successfully!');
    console.log('📧 Client details:', {
      inboxId: client.inboxId
    });
    
    // Store the client globally
    xmtpClient = client;
    
    return client;
  } catch (error) {
    console.error('❌ Failed to initialize XMTP V3 client:', error);
    console.error('Error details:', error);
    throw error;
  }
}

export function getClient() {
  return xmtpClient;
}

export function getInboxId() {
  return xmtpClient?.inboxId;
}

/**
 * Check if XMTP client is initialized
 */
export function isXMTPInitialized() {
  return xmtpClient !== null;
}

/**
 * Get XMTP client status
 */
export function getXMTPStatus() {
  if (!xmtpClient) {
    return { initialized: false, status: 'Not initialized' };
  }
  
  return {
    initialized: true,
    status: 'Ready',
    inboxId: xmtpClient.inboxId
  };
} 