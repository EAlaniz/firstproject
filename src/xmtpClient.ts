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

export async function initXMTPClient(): Promise<Client> {
  if (xmtpClient) return xmtpClient;

  const { isFarcaster, isMobile } = getEnvironmentInfo();
  
  try {
    console.log('Initializing XMTP V3 client for environment:', { isFarcaster, isMobile });
    
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
    } else if (isMobile) {
      // Mobile Web - use Coinbase Wallet
      console.log('Using Coinbase Wallet for mobile');
      walletClient = createWalletClient({
        chain: base,
        transport: custom(window.ethereum),
      });
    } else {
      // Desktop Web - use any available wallet
      console.log('Using desktop wallet');
      walletClient = createWalletClient({
        chain: base,
        transport: custom(window.ethereum),
      });
    }

    const [account] = await walletClient.getAddresses();
    console.log('Wallet account:', account);

    // @ts-expect-error XMTP SDK type mismatch
    xmtpClient = await Client.create(walletClient, { env: 'production' });
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