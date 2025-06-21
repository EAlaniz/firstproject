import { useState, useEffect } from 'react';

export function useMiniApp() {
  const [isInMiniApp, setIsInMiniApp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simple detection of Mini App context
    const checkMiniAppContext = () => {
      const isInFarcaster = 
        window.location.href.includes('farcaster.xyz') || 
        window.location.href.includes('warpcast.com') ||
        window.navigator.userAgent.includes('Farcaster') ||
        window.parent !== window; // Check if in iframe

      setIsInMiniApp(isInFarcaster);
      setIsLoading(false);

      if (isInFarcaster) {
        console.log('10K Wellness Mini App detected');
        document.body.classList.add('mini-app-mode');
      }
    };

    checkMiniAppContext();
  }, []);

  return { isInMiniApp, isLoading };
}
