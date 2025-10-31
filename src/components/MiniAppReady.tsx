import { useEffect } from 'react';

/**
 * Signals readiness to Base/Farcaster mini app host after app initialization.
 * This must be called for the mini app to display correctly in previews.
 * 
 * Based on Base docs: https://docs.base.org/mini-apps/core-concepts/initialization
 * 
 * OnchainKitProvider with miniKit.enabled should handle this automatically, but
 * we explicitly signal readiness as a fallback to ensure previews work correctly.
 */
export function MiniAppReady() {
  useEffect(() => {
    // Only signal readiness if we're in a mini app (iframe)
    if (typeof window === 'undefined' || window.self === window.top) {
      return;
    }

    let signaled = false;

    // Wait for providers to initialize, then signal readiness
    const signalReady = async () => {
      if (signaled) return; // Only signal once

      try {
        const win = window as any;
        
        // Method 1: Try to access SDK through OnchainKit's exposed instance
        // OnchainKit may expose the SDK on window when miniKit is enabled
        if (win.BaseMiniKit?.actions?.ready) {
          win.BaseMiniKit.actions.ready();
          console.log('✅ Ready signal sent via BaseMiniKit');
          signaled = true;
          return;
        }

        // Method 2: Try Farcaster SDK instance (if OnchainKit exposes it)
        if (win.farcaster?.miniapp?.sdk?.actions?.ready) {
          win.farcaster.miniapp.sdk.actions.ready();
          console.log('✅ Ready signal sent via Farcaster SDK (window)');
          signaled = true;
          return;
        }

        // Method 3: Try to dynamically import and use the SDK
        // This works if @farcaster/miniapp-sdk is available (via OnchainKit's deps)
        try {
          // Check if we can access the SDK module (it might be bundled by OnchainKit)
          const sdkModule = await import('@farcaster/miniapp-sdk').catch(() => null);
          if (sdkModule?.default?.actions?.ready) {
            sdkModule.default.actions.ready();
            console.log('✅ Ready signal sent via Farcaster SDK (import)');
            signaled = true;
            return;
          }
        } catch (e) {
          // SDK not available as import, continue to postMessage fallback
        }

        // Method 4: Use postMessage (standard Base/Farcaster protocol)
        // This is the fallback that always works across different hosts
        if (window.parent && window.parent !== window) {
          // Standard Farcaster ready message
          window.parent.postMessage(
            { type: 'farcaster:ready', source: 'miniapp' },
            '*'
          );
          
          // Base-specific ready message format
          window.parent.postMessage(
            { type: 'base:ready', source: 'miniapp' },
            '*'
          );
          
          console.log('✅ Ready signal sent via postMessage');
          signaled = true;
        }
      } catch (error) {
        console.warn('⚠️ Failed to signal mini app readiness:', error);
        // Still try postMessage as last resort
        if (!signaled && window.parent && window.parent !== window) {
          window.parent.postMessage(
            { type: 'farcaster:ready', source: 'miniapp' },
            '*'
          );
          signaled = true;
        }
      }
    };

    // Try immediately, then retry with delays to catch SDK initialization
    signalReady();
    const timeoutId = setTimeout(() => signalReady(), 300);
    const timeoutId2 = setTimeout(() => signalReady(), 1000);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, []);

  return null;
}

