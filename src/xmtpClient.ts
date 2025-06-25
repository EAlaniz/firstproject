import { Client } from "@xmtp/browser-sdk";
import { createWalletClient, custom } from 'viem';
import { base } from 'viem/chains';

// Environment detection
export const getEnvironmentInfo = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  
  // Check if we're in a Farcaster mini app environment
  const isFarcaster = window.location.hostname.includes('warpcast.com') || 
                     window.location.hostname.includes('farcaster.xyz') ||
                     window.location.hostname.includes('farcaster.com') ||
                     typeof window !== 'undefined' && 'farcaster' in window && window.farcaster !== undefined;
  
  const isDesktop = !isMobile && !isFarcaster;
  const environment = isFarcaster ? 'farcaster' : isMobile ? 'mobile' : 'desktop';
  
  return { isFarcaster, isMobile, isDesktop, environment };
};

let xmtpClient: Client | null = null;

// Create a proper signer wrapper that implements the required interface
class WalletClientSigner {
  private walletClient: any;
  private address: string;

  constructor(walletClient: any, address: string) {
    this.walletClient = walletClient;
    this.address = address;
  }

  getIdentifier(): string {
    return this.address;
  }

  async signMessage(message: string): Promise<string> {
    return this.walletClient.signMessage({ message });
  }

  getChainId(): bigint {
    return BigInt(base.id);
  }
}

export async function initXMTPClient(): Promise<Client> {
  if (xmtpClient) return xmtpClient;

  const { isFarcaster } = getEnvironmentInfo();
  
  try {
    console.log('Initializing XMTP V3 client for environment:', { isFarcaster });
    
    let walletClient;
    
    if (isFarcaster) {
      // Farcaster Mini App - use injected wallet
      if (typeof window !== 'undefined' && window.farcaster) {
        console.log('Using Farcaster injected wallet');
        walletClient = createWalletClient({
          chain: base,
          transport: custom(window.farcaster.getProvider?.() || window.ethereum),
        });
      } else {
        throw new Error('Farcaster wallet not available');
      }
    } else {
      // Desktop/Mobile Web - use window.ethereum
      console.log('Using window.ethereum');
      if (!window.ethereum) {
        throw new Error('No wallet provider available');
      }
      
      walletClient = createWalletClient({
        chain: base,
        transport: custom(window.ethereum),
      });
    }

    // Get account address
    const [account] = await walletClient.getAddresses();
    console.log('Wallet account:', account);

    // Create proper signer wrapper
    const signer = new WalletClientSigner(walletClient, account);

    // Create XMTP client with proper signer
    xmtpClient = await Client.create(signer as any, { 
      env: 'production',
      codecs: [],
    });
    
    console.log('XMTP V3 Client ready for account:', account);

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