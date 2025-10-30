import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useCapabilities, useWriteContracts } from 'wagmi/experimental';

export function useSponsoredTransactions(paymasterUrl?: string) {
  const account = useAccount();
  const { data: available } = useCapabilities({ account: account.address });
  const { writeContracts } = useWriteContracts();

  const caps = useMemo(() => {
    if (!available || !account.chainId) return {} as Record<string, unknown>;
    const c = (available as any)[account.chainId];
    if (c?.paymasterService?.supported && paymasterUrl) {
      return { paymasterService: { url: paymasterUrl } } as Record<string, unknown>;
    }
    return {} as Record<string, unknown>;
  }, [available, account.chainId, paymasterUrl]);

  const sponsoredWrite = (contracts: any[]) =>
    writeContracts({ contracts, capabilities: caps as any });

  return { sponsoredWrite, hasPaymaster: Boolean((caps as any).paymasterService) };
}


