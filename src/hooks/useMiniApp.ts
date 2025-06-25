import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/frame-sdk';

export interface MiniAppState {
  isMiniApp: boolean;
  isMiniAppReady: boolean;
  walletError: string | null;
}

export const useMiniApp = (): MiniAppState => {
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [isMiniAppReady, setIsMiniAppReady] = useState(false);
  const [walletError] = useState<string | null>(null);

  useEffect(() => {
    const detectMiniApp = async () => {
      try {
        const miniAppStatus = await sdk.isInMiniApp();
        setIsMiniApp(miniAppStatus);
        
        if (miniAppStatus) {
          console.log('Running as Farcaster Mini App');
          
          try {
            await sdk.actions.ready();
            console.log('Mini app ready');
          } catch (readyError) {
            console.error('Error calling sdk.actions.ready():', readyError);
          }
          
          setIsMiniAppReady(true);
          
          // Listen for mini app events
          sdk.on('notificationsEnabled', () => {
            console.log('Notifications enabled');
          });
          
          sdk.on('notificationsDisabled', () => {
            console.log('Notifications disabled');
          });
          
        } else {
          console.log('Running as web app');
          setIsMiniAppReady(true);
        }
      } catch (error) {
        console.error('Error detecting mini app:', error);
        setIsMiniAppReady(true);
      }
    };
    
    detectMiniApp();
  }, []);

  return { isMiniApp, isMiniAppReady, walletError };
}; 