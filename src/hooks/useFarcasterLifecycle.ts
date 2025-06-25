import { useEffect, useState } from 'react';
import { initXMTPClient, clearXMTPClient } from '../xmtpClient';
import type { Client } from '@xmtp/browser-sdk';

export function useFarcasterLifecycle() {
  const [client, setClient] = useState<Client | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isFarcaster = window.location.hostname.includes('warpcast.com') || 
                       window.location.hostname.includes('farcaster.xyz') ||
                       window.location.hostname.includes('farcaster.com') ||
                       typeof window !== 'undefined' && 'farcaster' in window && window.farcaster !== undefined;

    if (!isFarcaster) {
      // Not in Farcaster environment, initialize normally
      const initializeClient = async () => {
        try {
          const xmtpClient = await initXMTPClient();
          setClient(xmtpClient);
          setIsReady(true);
        } catch (err) {
          console.error('Failed to initialize XMTP:', err);
          setError('Failed to initialize XMTP');
        }
      };
      
      initializeClient();
      return;
    }

    // Farcaster Mini App lifecycle
    if (typeof window !== 'undefined' && window.farcaster) {
      console.log('Setting up Farcaster mini app lifecycle');

      // Handle Farcaster ready event
      const farcaster = window.farcaster as any;
      if (farcaster.onReady) {
        farcaster.onReady(async () => {
          console.log('Farcaster mini app ready, initializing XMTP...');
          try {
            const xmtpClient = await initXMTPClient();
            setClient(xmtpClient);
            setIsReady(true);
            setError(null);
          } catch (err) {
            console.error('Failed to initialize XMTP in Farcaster:', err);
            setError('Failed to initialize XMTP');
          }
        });
      }

      // Handle back navigation
      if (farcaster.onBack) {
        farcaster.onBack(() => {
          console.log('Farcaster back navigation, cleaning up...');
          // Cleanup if needed
        });
      }

      // Cleanup on destroy
      return () => {
        console.log('Farcaster mini app cleanup');
        if (farcaster.onDestroy) {
          farcaster.onDestroy();
        }
        clearXMTPClient();
      };
    }
  }, []);

  return { client, isReady, error };
} 