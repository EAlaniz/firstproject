import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWatchContractEvent } from 'wagmi';
import { parseEther, formatEther } from 'viem';

// Clanker Token ABI (simplified for common ERC-20 functions)
const CLANKER_TOKEN_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'Transfer',
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false }
    ]
  }
] as const;

export interface ClankerTokenData {
  balance: string;
  formattedBalance: string;
  totalSupply: string;
  contractAddress: string;
  symbol: string;
  name: string;
}

export function useClankerToken(tokenAddress?: `0x${string}`) {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending: isTransferPending } = useWriteContract();
  
  const [tokenData, setTokenData] = useState<ClankerTokenData | null>(null);
  const [recentTransfers, setRecentTransfers] = useState<any[]>([]);

  // Default Clanker token address (replace with actual deployed address)
  const CLANKER_TOKEN_ADDRESS = tokenAddress || import.meta.env.VITE_CLANKER_TOKEN_ADDRESS as `0x${string}`;

  // Read token balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: CLANKER_TOKEN_ADDRESS,
    abi: CLANKER_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!CLANKER_TOKEN_ADDRESS }
  });

  // Read total supply
  const { data: totalSupply } = useReadContract({
    address: CLANKER_TOKEN_ADDRESS,
    abi: CLANKER_TOKEN_ABI,
    functionName: 'totalSupply',
    query: { enabled: !!CLANKER_TOKEN_ADDRESS }
  });

  // Watch for transfer events
  useWatchContractEvent({
    address: CLANKER_TOKEN_ADDRESS,
    abi: CLANKER_TOKEN_ABI,
    eventName: 'Transfer',
    onLogs(logs) {
      const transfers = logs.map(log => ({
        from: log.args.from,
        to: log.args.to,
        value: log.args.value,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash
      }));
      
      setRecentTransfers(prev => [...transfers, ...prev].slice(0, 10)); // Keep last 10
      
      // Refetch balance if transfer involves current user
      if (address && logs.some(log => 
        log.args.from?.toLowerCase() === address.toLowerCase() || 
        log.args.to?.toLowerCase() === address.toLowerCase()
      )) {
        refetchBalance();
      }
    }
  });

  // Update token data when balance or supply changes
  useEffect(() => {
    if (balance !== undefined && totalSupply !== undefined && CLANKER_TOKEN_ADDRESS) {
      setTokenData({
        balance: balance.toString(),
        formattedBalance: formatEther(balance),
        totalSupply: totalSupply.toString(),
        contractAddress: CLANKER_TOKEN_ADDRESS,
        symbol: 'CLANKER', // Default symbol
        name: 'Clanker Token' // Default name
      });
    }
  }, [balance, totalSupply, CLANKER_TOKEN_ADDRESS]);

  // Transfer tokens
  const transferTokens = async (to: `0x${string}`, amount: string) => {
    if (!CLANKER_TOKEN_ADDRESS || !isConnected) {
      throw new Error('Token contract not configured or wallet not connected');
    }

    try {
      const amountWei = parseEther(amount);
      
      await writeContract({
        address: CLANKER_TOKEN_ADDRESS,
        abi: CLANKER_TOKEN_ABI,
        functionName: 'transfer',
        args: [to, amountWei]
      });
    } catch (error) {
      console.error('Transfer failed:', error);
      throw error;
    }
  };

  // Approve tokens for spending
  const approveTokens = async (spender: `0x${string}`, amount: string) => {
    if (!CLANKER_TOKEN_ADDRESS || !isConnected) {
      throw new Error('Token contract not configured or wallet not connected');
    }

    try {
      const amountWei = parseEther(amount);
      
      await writeContract({
        address: CLANKER_TOKEN_ADDRESS,
        abi: CLANKER_TOKEN_ABI,
        functionName: 'approve',
        args: [spender, amountWei]
      });
    } catch (error) {
      console.error('Approval failed:', error);
      throw error;
    }
  };

  // Reward user with tokens (for step goals)
  const rewardUser = async (amount: string) => {
    // This would typically be called by a backend service or smart contract
    // For demo purposes, we'll simulate the reward
    console.log(`Rewarding user with ${amount} CLANKER tokens`);
    
    // In a real implementation, this would trigger a contract call
    // from a reward distribution contract
    setTimeout(() => {
      refetchBalance();
    }, 2000);
  };

  return {
    tokenData,
    recentTransfers,
    isTransferPending,
    transferTokens,
    approveTokens,
    rewardUser,
    refetchBalance,
    isConnected,
    contractAddress: CLANKER_TOKEN_ADDRESS
  };
}