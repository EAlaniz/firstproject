import { Client } from '@xmtp/browser-sdk';
import { createWalletClient, custom } from 'viem';
import { base } from 'viem/chains';

let xmtpClient: Client | null = null;

// Database encryption key for the local database (required for V3)
const databaseEncryptionKey = new Uint8Array([
  233, 120, 198, 96, 154, 65, 132, 17, 132, 96, 250, 40, 103, 35, 125, 64,
  166, 83, 208, 224, 254, 44, 205, 227, 175, 49, 234, 129, 74, 252, 135, 145,
]);

export async function createSigner() {
  const walletClient = createWalletClient({
    chain: base,
    transport: custom(window.ethereum),
  });

  const [address] = await walletClient.getAddresses();

  return {
    getAddress: () => Promise.resolve(address),
    signMessage: (message: string) =>
      walletClient.signMessage({ account: address, message }),
  };
}

export async function initXMTP() {
  try {
    console.log('Initializing XMTP V3 client...');
    
    const signer = await createSigner();
    console.log('Signer created for address:', await signer.getAddress());

    // Initialize client with signer and environment (production or dev)
    xmtpClient = await Client.create(signer, { env: 'production' });

    console.log('✅ XMTP V3 client created successfully');
    return xmtpClient;
  } catch (error) {
    console.error('❌ Failed to initialize XMTP V3 client:', error);
    throw error;
  }
}

export async function sendMessage(recipientAddress: string, messageText: string) {
  if (!xmtpClient) {
    throw new Error('XMTP client not initialized. Call initXMTP() first.');
  }

  try {
    console.log('Sending message to address:', recipientAddress);
    
    // Create or find DM conversation
    const conversation = await xmtpClient.conversations.newConversation(recipientAddress);
    
    // Send the message
    await conversation.send(messageText);
    
    console.log('✅ Message sent successfully');
  } catch (error) {
    console.error('❌ Failed to send message:', error);
    throw error;
  }
}

export async function startMessageStream() {
  if (!xmtpClient) {
    throw new Error('XMTP client not initialized. Call initXMTP() first.');
  }

  try {
    console.log('Starting message stream...');
    
    // Stream conversations and messages
    for await (const conversation of await xmtpClient.conversations.stream()) {
      console.log('New conversation:', conversation.id);
      
      for await (const message of await conversation.streamMessages()) {
        console.log(`📥 New message from ${message.senderAddress}: ${message.content}`);
      }
    }
  } catch (error) {
    console.error('❌ Error in message stream:', error);
    throw error;
  }
}

export async function listConversations() {
  if (!xmtpClient) {
    throw new Error('XMTP client not initialized. Call initXMTP() first.');
  }

  try {
    const conversations = await xmtpClient.conversations.list();
    console.log('Conversations:', conversations);
    return conversations;
  } catch (error) {
    console.error('❌ Failed to list conversations:', error);
    throw error;
  }
}

export async function canMessage(address: string) {
  if (!xmtpClient) {
    throw new Error('XMTP client not initialized. Call initXMTP() first.');
  }

  try {
    const canMessageResult = await xmtpClient.canMessage(address);
    console.log('Can message', address, ':', canMessageResult);
    return canMessageResult;
  } catch (error) {
    console.error('❌ Failed to check if can message:', error);
    return false;
  }
}

export function getClient() {
  return xmtpClient;
}

export function getInboxId() {
  return xmtpClient?.inboxId;
} 