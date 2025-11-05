import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { getPublicClient } from '@wagmi/core';
import { wagmiConfig } from '../../wagmi.config';

// Lightweight detector for Base App Mini App environment
// Prefers capability availability; falls back to UA or global hints
export function useIsBaseMiniApp(): { isMiniApp: boolean; ready: boolean } {
  const { address } = useAccount();
  const [isMiniApp, setIsMiniApp] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Heuristic 1: Check if embedded in iframe (strongest signal for Mini Apps)
        if (typeof window !== 'undefined') {
          // Also check viewport width as additional signal (mobile devices)
          const isNarrowViewport = window.innerWidth < 500;
          const isEmbedded = window.self !== window.top;

          if (isEmbedded || isNarrowViewport) {
            if (!cancelled) {
              console.log('🔍 Mini App detected:', { isEmbedded, isNarrowViewport, width: window.innerWidth });
              setIsMiniApp(true);
              setReady(true);
              return;
            }
          }

          // Heuristic 1b: Check for OnchainKit MiniKit context or Base App hints
          const win = window as any;
          const isMiniKit = Boolean(
            win.__FARCASTER__ || 
            win.__MINIAPP__ || 
            win.__BASEAPP__ ||
            win.farcaster ||
            win.baseApp
          );
          
          // Check URL params or referrer
          const urlParams = new URLSearchParams(window.location.search);
          const isFromBase = urlParams.has('miniApp') || 
                             window.location.hostname.includes('warpcast.com') ||
                             window.location.hostname.includes('base.org') ||
                             document.referrer?.includes('base.org') ||
                             document.referrer?.includes('warpcast.com');
          
          if (isMiniKit || isFromBase) {
            if (!cancelled) {
              console.log('🔍 Mini App detected:', { isMiniKit, isFromBase });
              setIsMiniApp(true);
              setReady(true);
              return;
            }
          }
        }

        // Heuristic 2: capability request succeeds quickly in Base App
        if (address) {
          try {
            const client = getPublicClient(wagmiConfig) as unknown as { request: (args: { method: string; params?: unknown[] }) => Promise<any> };
            const caps = await client.request({
              method: 'wallet_getCapabilities',
              params: [address],
            });
            const baseHex = '0x2105';
            const hasAny = Boolean(caps?.[baseHex]);
            if (!cancelled) {
              setIsMiniApp(Boolean(hasAny));
              setReady(true);
              return;
            }
          } catch {
            // ignore; fall through
          }
        }

        // Heuristic 3: user agent or window properties
        if (typeof window !== 'undefined') {
          const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
          const win = window as any;
          const detected = /BaseApp/i.test(ua) || 
                          /Farcaster/i.test(ua) ||
                          Boolean(win.farcaster || win.baseApp);
          if (!cancelled) {
            setIsMiniApp(detected);
            setReady(true);
            return;
          }
        }

        if (!cancelled) {
          setReady(true);
        }
      } catch (err) {
        console.warn('Mini App detection error:', err);
        if (!cancelled) {
          setReady(true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [address]);

  return { isMiniApp, ready };
}


