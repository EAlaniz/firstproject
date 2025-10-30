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
        // Heuristic 1: global hint from Base App or MiniKit
        const hinted = typeof window !== 'undefined' &&
          (Boolean((window as any).__BASEAPP__) || Boolean((window as any).__MINIAPP__));

        if (hinted && !cancelled) {
          setIsMiniApp(true);
          setReady(true);
          return;
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

        // Heuristic 3: user agent
        const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
        if (!cancelled) {
          setIsMiniApp(/BaseApp/i.test(ua));
          setReady(true);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [address]);

  return { isMiniApp, ready };
}


