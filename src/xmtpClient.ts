import { Client } from "@xmtp/browser-sdk";
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

// Create a proper EIP-191 compatible signer
function createEIP191Signer(provider: any) {
  return {
    type: 'SCW' as const,
    getIdentifier: async () => {
      const accounts = await provider.request({ method: 'eth_accounts' });
      return accounts[0];
    },
    signMessage: async (message: string) => {
      const accounts = await provider.request({ method: 'eth_accounts' });
      return provider.request({
        method: 'personal_sign',
        params: [message, accounts[0]]
      });
    },
    getChainId: () => {
      return BigInt(base.id);
    }
  };
}

export async function initXMTPClient(): Promise<Client> {
  if (xmtpClient) return xmtpClient;

  const { isFarcaster } = getEnvironmentInfo();
  
  try {
    console.log('Initializing XMTP V3 client for environment:', { isFarcaster });
    
    let provider;
    
    if (isFarcaster) {
      // Farcaster Mini App - use injected wallet
      if (typeof window !== 'undefined' && window.farcaster) {
        console.log('Using Farcaster injected wallet');
        provider = window.farcaster.getProvider?.() || window.ethereum;
      } else {
        throw new Error('Farcaster wallet not available');
      }
    } else {
      // Desktop/Mobile Web - use window.ethereum
      console.log('Using window.ethereum');
      if (!window.ethereum) {
        throw new Error('No wallet provider available');
      }
      provider = window.ethereum;
    }

    // Create EIP-191 compatible signer
    const signer = createEIP191Signer(provider);
    
    // Get account address
    const account = await signer.getIdentifier();
    console.log('Wallet account:', account);

    // Create XMTP client with proper configuration
    xmtpClient = await Client.create(signer, { 
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