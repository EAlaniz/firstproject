// Example integration file showing how to adapt App.tsx for Base Chain

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { useCapabilities } from 'wagmi/experimental';
import { ConnectWallet, Wallet } from '@coinbase/onchainkit/wallet';
import { base } from 'wagmi/chains';
import Header from './components/Header';
import StepTracker from './components/StepTracker';
import ActivityShare from './components/ActivityShare';
import Achievements from './components/Achievements';
import SocialFeed from './components/SocialFeed';

// Contract ABI (simplified)
const stepTrackerAbi = [
  {
    name: 'getUserStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'totalSteps', type: 'uint256' },
      { name: 'currentStreak', type: 'uint256' },
      { name: 'totalGoalsCompleted', type: 'uint256' }
    ]
  },
  {
    name: 'recordDailyGoal',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'steps', type: 'uint256' },
      { name: 'goal', type: 'uint256' }
    ]
  }
] as const;

function BaseApp() {
  // Wagmi hooks for Base chain integration
  const { address, isConnected, chain } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const { data: capabilities } = useCapabilities({ account: address });
  
  // Contract addresses (replace with your deployed contracts)
  const STEP_TRACKER_CONTRACT = import.meta.env.VITE_STEP_TRACKER_CONTRACT as `0x${string}`;
  const TOKEN_CONTRACT = import.meta.env.VITE_TOKEN_CONTRACT as `0x${string}`;
  
  // Read user stats from Base chain
  const { data: userStats, refetch: refetchStats } = useReadContract({
    address: STEP_TRACKER_CONTRACT,
    abi: stepTrackerAbi,
    functionName: 'getUserStats',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });
  
  // Read token balance
  const { data: tokenBalance } = useReadContract({
    address: TOKEN_CONTRACT,
    abi: [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
      }
    ] as const,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });
  
  // Local state
  const [currentSteps, setCurrentSteps] = useState(7240);
  const [dailyGoal, setDailyGoal] = useState(10000);
  
  // Extract data from contract
  const currentStreak = userStats ? Number(userStats[1]) : 0;
  const totalTokens = tokenBalance ? Number(tokenBalance) / 10**18 : 0; // Assuming 18 decimals
  
  const isGoalReached = currentSteps >= dailyGoal;
  
  // Record goal completion on Base chain
  const handleGoalComplete = async () => {
    if (!isConnected || !address || currentSteps < dailyGoal) return;
    
    try {
      await writeContract({
        address: STEP_TRACKER_CONTRACT,
        abi: stepTrackerAbi,
        functionName: 'recordDailyGoal',
        args: [BigInt(currentSteps), BigInt(dailyGoal)],
      });
      
      // Refetch stats after transaction
      setTimeout(() => refetchStats(), 2000);
    } catch (error) {
      console.error('Failed to record goal completion:', error);
    }
  };
  
  // Auto-complete goal when reached
  useEffect(() => {
    if (isGoalReached && isConnected) {
      handleGoalComplete();
    }
  }, [isGoalReached, isConnected]);
  
  // Simulate step updates (replace with actual fitness tracker integration)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSteps(prev => {
        const increment = Math.floor(Math.random() * 20) + 5;
        return Math.min(prev + increment, dailyGoal + 2000);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [dailyGoal]);
  
  // Show wallet connection if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-green-400 mb-4">10K</h1>
          <p className="text-gray-400 mb-6">Move. Earn. Connect.</p>
          <p className="text-gray-400 mb-6">Connect your wallet to start tracking on Base</p>
          
          <ConnectWallet>
            <Wallet>
              <div className="bg-green-400 text-black px-6 py-3 font-bold hover:bg-green-300 transition-colors cursor-pointer">
                CONNECT WALLET
              </div>
            </Wallet>
          </ConnectWallet>
          
          <div className="mt-4 text-xs text-gray-500">
            Powered by Base Chain • Low fees • Fast transactions
          </div>
        </div>
      </div>
    );
  }
  
  // Show wrong network if not on Base
  if (chain && chain.id !== base.id) {
    return (
      <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-400 mb-4">Wrong Network</h1>
          <p className="text-gray-400 mb-6">Please switch to Base network</p>
          <div className="text-xs text-gray-500">
            Current: {chain.name} • Required: Base
          </div>
        </div>
      </div>
    );
  }
  
  // Mock achievements data (replace with contract data)
  const achievements = [
    {
      id: '1',
      title: 'FIRST STEPS',
      description: 'Complete your first daily goal',
      icon: <span>⭐</span>,
      earned: true
    },
    {
      id: '2',
      title: 'STREAK MASTER',
      description: 'Maintain a 7-day streak',
      icon: <span>🔥</span>,
      earned: currentStreak >= 7
    },
    {
      id: '3',
      title: 'TOKEN COLLECTOR',
      description: 'Earn 100 tokens',
      icon: <span>👑</span>,
      earned: totalTokens >= 100
    },
    {
      id: '4',
      title: 'POWER WALKER',
      description: 'Walk 15,000 steps in a day',
      icon: <span>⚡</span>,
      earned: false,
      progress: currentSteps,
      maxProgress: 15000
    }
  ];

  // Mock social feed data
  const feedPosts = [
    {
      id: '1',
      username: 'walker_alex',
      steps: 12500,
      contentType: 'music' as const,
      content: '🎵 Just crushed my walk listening to "Don\'t Stop Me Now" by Queen! Nothing beats classic rock for motivation! 🚀',
      likes: 23,
      comments: 5,
      timestamp: '2h ago'
    },
    {
      id: '2',
      username: 'fit_sarah',
      steps: 10800,
      contentType: 'podcast' as const,
      content: '🎧 Mind blown by today\'s episode of "How I Built This" - perfect walking companion for entrepreneurs!',
      likes: 18,
      comments: 3,
      timestamp: '3h ago'
    },
    {
      id: '3',
      username: 'book_lover_mike',
      steps: 11200,
      contentType: 'audiobook' as const,
      content: '📚 Getting lost in "Atomic Habits" while walking through the park. Great combo of physical and mental exercise!',
      likes: 31,
      comments: 7,
      timestamp: '4h ago'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <Header currentStreak={currentStreak} totalTokens={Math.floor(totalTokens)} />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        <StepTracker 
          currentSteps={currentSteps}
          dailyGoal={dailyGoal}
          onGoalChange={setDailyGoal}
        />
        
        <ActivityShare isUnlocked={isGoalReached} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Achievements achievements={achievements} />
          <SocialFeed posts={feedPosts} isUnlocked={isGoalReached} />
        </div>
        
        {/* Base Chain integration notice */}
        <div className="mt-8 p-4 bg-gray-900 border-2 border-blue-400 text-center">
          <p className="text-blue-400 text-sm font-bold mb-2">
            🔗 Connected to Base Chain
          </p>
          <p className="text-gray-400 text-xs">
            Wallet: {address?.slice(0, 6)}...{address?.slice(-4)} • 
            Network: {chain?.name} • 
            {isPending && ' Transaction pending...'}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            🔗 Fitness integrations: Apple Health • Fitbit • Garmin • Whoop • Oura Ring
          </p>
          <p className="text-gray-400 text-sm mt-1">
            💬 XMTP messaging & Farcaster frames coming soon!
          </p>
        </div>
      </main>
    </div>
  );
}

export default BaseApp;