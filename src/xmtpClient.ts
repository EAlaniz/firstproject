import { Client } from "@xmtp/browser-sdk";

let xmtpClient: Client | null = null;

export async function initXMTP(signer: any) {
  if (xmtpClient) return xmtpClient;
  
  try {
    console.log('Initializing XMTP V3 client...');
    xmtpClient = await Client.create(signer, { 
      env: "production"
    });
    console.log('XMTP V3 client initialized successfully');
    return xmtpClient;
  } catch (error) {
    console.error('Failed to initialize XMTP V3 client:', error);
    throw error;
  }
}

export function getXMTPClient(): Client | null {
  return xmtpClient;
}

export function clearXMTPClient() {
  xmtpClient = null;
} 