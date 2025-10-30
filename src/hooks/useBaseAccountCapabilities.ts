import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { getPublicClient } from '@wagmi/core';
import { wagmiConfig } from '../../wagmi.config';

export type BaseCapabilities = {
  atomicBatch?: boolean;
  paymasterService?: boolean;
  auxiliaryFunds?: boolean;
};

export function useBaseAccountCapabilities(): { capabilities: BaseCapabilities; loading: boolean } {
  const { address } = useAccount();
  const [capabilities, setCapabilities] = useState<BaseCapabilities>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!address) {
        setCapabilities({});
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const client = getPublicClient(wagmiConfig) as unknown as { request: (args: { method: string; params?: unknown[] }) => Promise<any> };
        const resp = await client.request({
          method: 'wallet_getCapabilities',
          params: [address],
        });
        const baseHex = '0x2105';
        const caps = resp?.[baseHex] || {};
        if (!cancelled) {
          setCapabilities({
            atomicBatch: caps?.atomicBatch?.supported === true,
            paymasterService: caps?.paymasterService?.supported === true,
            auxiliaryFunds: caps?.auxiliaryFunds?.supported === true,
          });
        }
      } catch {
        if (!cancelled) setCapabilities({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [address]);

  return { capabilities, loading };
}


