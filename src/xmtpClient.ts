import { Client } from '@xmtp/browser-sdk';

let xmtpClient: Client | null = null;

// Database encryption key for the local database (required for V3)
const databaseEncryptionKey = new Uint8Array([
  233, 120, 198, 96, 154, 65, 132, 17, 132, 96, 250, 40, 103, 35, 125, 64,
  166, 83, 208, 224, 254, 44, 205, 227, 175, 49, 234, 129, 74, 252, 135, 145,
]);

export async function createSigner(walletClient: any) {
  return {
    getAddress: () => Promise.resolve(walletClient.account.address),
    signMessage: (message: string) => walletClient.signMessage({ message }),
    getIdentifier: () =>
      Promise.resolve({
        identifier: walletClient.account.address,
        identifierKind: 'Ethereum',
      }),
  };
}

export async function initXMTP(walletClient: any) {
  try {
    console.log('Initializing XMTP V3 client...');
    
    // Create signer with all required methods including getIdentifier
    const signer = await createSigner(walletClient);
    console.log('Signer created for address:', await signer.getAddress());

    // Initialize client with signer and environment (production or dev)
    xmtpClient = await Client.create(signer as any, { env: 'production' });

    console.log('✅ XMTP V3 client created successfully');
    return xmtpClient;
  } catch (error) {
    console.error('❌ Failed to initialize XMTP V3 client:', error);
    throw error;
  }
}

export function getClient() {
  return xmtpClient;
}

export function getInboxId() {
  return xmtpClient?.inboxId;
} 