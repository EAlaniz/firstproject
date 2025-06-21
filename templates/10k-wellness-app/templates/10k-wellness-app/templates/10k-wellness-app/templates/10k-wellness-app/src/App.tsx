import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { 
  ConnectWallet, 
  Wallet, 
  WalletDropdown, 
  WalletDropdownLink, 
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import { 
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';
import { color } from '@coinbase/onchainkit/theme';
import { base } from 'wagmi/chains';
import { Activity, Target, Trophy, Users, Zap, ArrowRight, Circle, CheckCircle2, X, Share2, Copy, MessageCircle, Gift, Smartphone, Menu, Bell, Lock, Heart, ThumbsUp, Send, Plus } from 'lucide-react';
import MessagingPanel from './components/MessagingPanel';
import WearablesPanel from './components/WearablesPanel';
import { useXMTP } from './hooks/useXMTP';
import { useWearables } from './hooks/useWearables';

// Contract ABI (simplified for demo)
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
      { name: 'steps', type: 'uint256' }
    ]
  }
] as const;

function App() {
  // Wagmi hooks for Base chain integration
  const { address, isConnected, chain } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  
  // XMTP integration
  const { isEnabled: xmtpEnabled, isInitializing: xmtpInitializing, communityFeed, postToCommunity } = useXMTP();
  
  // Wearables integration
  const { currentData: wearableData, connections: wearableConnections } = useWearables();
  
  // Contract addresses
  const STEP_TRACKER_CONTRACT = import.meta.env.VITE_STEP_TRACKER_CONTRACT as `0x${string}`;
  
  // Read user stats from Base chain
  const { data: userStats, refetch: refetchStats } = useReadContract({
    address: STEP_TRACKER_CONTRACT,
    abi: stepTrackerAbi,
    functionName: 'getUserStats',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!STEP_TRACKER_CONTRACT }
  });
  
  // Local state
  const [currentSteps, setCurrentSteps] = useState(7240);
  const [dailyGoal, setDailyGoal] = useState(10000);
  
  // Modal states
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [showMessagingPanel, setShowMessagingPanel] = useState(false);
  const [showWearablesPanel, setShowWearablesPanel] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Social component state
  const [newPost, setNewPost] = useState('');
  const [activeTab, setActiveTab] = useState<'share' | 'feed' | 'achievements'>('share');
  
  // Extract data from contract
  const currentStreak = userStats ? Number(userStats[1]) : 12;
  const totalTokens = 156;
  
  const isGoalReached = currentSteps >= dailyGoal;
  const progress = Math.min((currentSteps / dailyGoal) * 100, 100);
  
  // Update steps from wearable data
  useEffect(() => {
    if (wearableData && wearableData.steps) {
      setCurrentSteps(wearableData.steps);
    }
  }, [wearableData]);
  
  // Simulate step updates if no wearable data
  useEffect(() => {
    if (wearableData) return; // Don't simulate if we have real data
    
    const interval = setInterval(() => {
      setCurrentSteps(prev => {
        const increment = Math.floor(Math.random() * 20) + 5;
        return Math.min(prev + increment, dailyGoal + 2000);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [dailyGoal, wearableData]);

  // Handle share functionality
  const handleShare = async (platform: string) => {
    const shareText = `Just hit ${currentSteps.toLocaleString()} steps today on 10K! 🚶‍♂️ Join me in earning tokens for staying active. #10K #MoveToEarn`;
    const shareUrl = window.location.origin;
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
        break;
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({
              title: '10K - Move. Earn. Connect.',
              text: shareText,
              url: shareUrl,
            });
          } catch (err) {
            console.error('Error sharing:', err);
          }
        }
        break;
    }
  };

  // Handle community post
  const handlePostToCommunity = async () => {
    if (!newPost.trim() || !isGoalReached) return;
    
    try {
      await postToCommunity(newPost.trim(), 'achievement');
      setNewPost('');
      console.log('Posted to community:', newPost);
    } catch (error) {
      console.error('Failed to post to community:', error);
    }
  };

  // Handle reward claim
  const handleClaimReward = async () => {
    if (!isGoalReached) return;
    
    try {
      // Simulate reward claiming
      console.log('Claiming daily reward...');
      // In real implementation, this would call the smart contract
      setTimeout(() => {
        setShowRewardsModal(false);
        // Show success message or update UI
      }, 1000);
    } catch (error) {
      console.error('Failed to claim reward:', error);
    }
  };

  // Mock achievements data
  const achievements = [
    {
      id: '1',
      title: 'Daily Goal Master',
      description: 'Complete your daily step goal',
      icon: '🎯',
      earned: isGoalReached,
      steps: currentSteps,
      timestamp: new Date()
    },
    {
      id: '2',
      title: 'Streak Champion',
      description: `Maintain a ${currentStreak}-day streak`,
      icon: '🔥',
      earned: currentStreak >= 7,
      steps: currentSteps,
      timestamp: new Date(Date.now() - 86400000)
    },
    {
      id: '3',
      title: 'Distance Walker',
      description: 'Walk over 8km in a day',
      icon: '🚶‍♂️',
      earned: currentSteps > 10000,
      steps: currentSteps,
      timestamp: new Date(Date.now() - 172800000)
    }
  ];

  // Modal component
  const Modal = ({ isOpen, onClose, title, children }: { 
    isOpen: boolean; 
    onClose: () => void; 
    title: string; 
    children: React.ReactNode; 
  }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
        <div className="bg-white w-full sm:max-w-2xl sm:w-full max-h-[90vh] overflow-y-auto sm:rounded-2xl rounded-t-2xl">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-medium">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    );
  };
  
  // Show wallet connection if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white text-black">
        {/* Header */}
        <header className="border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-medium">10K</span>
            </div>
            
            <ConnectWallet>
              <div className="bg-black text-white px-4 sm:px-6 py-2 rounded-full hover:bg-gray-800 transition-colors cursor-pointer text-sm font-medium">
                Connect
              </div>
            </ConnectWallet>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="text-center space-y-6 sm:space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl font-light tracking-tight leading-tight">
                Move. Earn. Connect.
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
                An inclusive wellness platform that rewards your daily movement with tokens and connects you with a community of movers.
              </p>
            </div>
            
            <div className="flex justify-center px-4">
              <ConnectWallet>
                <div className="bg-black text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:bg-gray-800 transition-colors cursor-pointer font-medium flex items-center space-x-2 w-full sm:w-auto justify-center">
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </ConnectWallet>
            </div>
            
            <div className="pt-8 sm:pt-12 text-sm text-gray-500">
              Powered by Base Chain • Low fees • Fast transactions
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  // Show wrong network if not on Base
  if (chain && chain.id !== base.id) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-sm mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-medium">Wrong Network</h1>
            <p className="text-gray-600">Please switch to Base network to continue</p>
          </div>
          
          <Wallet>
            <ConnectWallet>
              <div className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-colors cursor-pointer w-full">
                Switch Network
              </div>
            </ConnectWallet>
            <WalletDropdown>
              {address && (
                <Identity className="px-4 pt-3 pb-2" address={address} hasCopyAddressOnClick>
                  <Avatar />
                  <Name />
                  <Address className={color.foregroundMuted} />
                  <EthBalance />
                </Identity>
              )}
              <WalletDropdownLink
                icon="wallet"
                href="https://keys.coinbase.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Wallet
              </WalletDropdownLink>
              <WalletDropdownDisconnect />
            </WalletDropdown>
          </Wallet>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Mobile Header */}
      <header className="border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-medium">10K</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center space-x-6">
            {/* Stats */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="font-medium">{currentStreak}</span>
                <span className="text-gray-600 hidden lg:inline">day streak</span>
              </div>
              <div className="flex items-center space-x-2">
                <Circle className="w-4 h-4 text-purple-500 fill-current" />
                <span className="font-medium">{totalTokens}</span>
                <span className="text-gray-600 hidden lg:inline">tokens</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowWearablesPanel(true)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Wearables"
              >
                <Smartphone className="w-5 h-5" />
                {wearableConnections.some(c => c.connected) && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
                )}
              </button>

              <button
                onClick={() => setShowMessagingPanel(true)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Messages"
              >
                <MessageCircle className="w-5 h-5" />
                {xmtpEnabled && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
                )}
                {xmtpInitializing && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                )}
              </button>
              
              {/* Wallet */}
              <Wallet>
                <ConnectWallet>
                  <div className="bg-gray-100 text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors cursor-pointer text-sm">
                    Wallet
                  </div>
                </ConnectWallet>
                <WalletDropdown>
                  {address && (
                    <Identity className="px-4 pt-3 pb-2" address={address} hasCopyAddressOnClick>
                      <Avatar />
                      <Name />
                      <Address className={color.foregroundMuted} />
                      <EthBalance />
                    </Identity>
                  )}
                  <WalletDropdownLink
                    icon="wallet"
                    href="https://keys.coinbase.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Wallet
                  </WalletDropdownLink>
                  <WalletDropdownDisconnect />
                </WalletDropdown>
              </Wallet>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2 sm:hidden">
            <button
              onClick={() => setShowMobileMenu(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Stats Bar */}
      <div className="sm:hidden border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-center space-x-8 text-sm">
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="font-medium">{currentStreak}</span>
            <span className="text-gray-600">streak</span>
          </div>
          <div className="flex items-center space-x-2">
            <Circle className="w-4 h-4 text-purple-500 fill-current" />
            <span className="font-medium">{totalTokens}</span>
            <span className="text-gray-600">tokens</span>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Today's Progress */}
        <section className="mb-8 sm:mb-16">
          <div className="text-center space-y-6 sm:space-y-8">
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-light tracking-tight">
                {currentSteps.toLocaleString()}
              </h1>
              <p className="text-gray-600">
                of {dailyGoal.toLocaleString()} steps today
              </p>
              {wearableData && (
                <p className="text-sm text-gray-500">
                  via {wearableData.source.replace('_', ' ')} • last sync {wearableData.lastSync.toLocaleTimeString()}
                </p>
              )}
            </div>
            
            {/* Progress Circle */}
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                  className={`transition-all duration-1000 ${
                    isGoalReached ? 'text-green-500' : 'text-black'
                  }`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-medium">
                    {Math.round(progress)}%
                  </div>
                  {isGoalReached && (
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mx-auto mt-1" />
                  )}
                </div>
              </div>
            </div>
            
            {/* Goal Selector */}
            <div className="flex justify-center">
              <select 
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className="bg-gray-100 border-0 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value={5000}>5K Steps</option>
                <option value={7500}>7.5K Steps</option>
                <option value={10000}>10K Steps</option>
                <option value={12500}>12.5K Steps</option>
                <option value={15000}>15K Steps</option>
              </select>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-8 sm:mb-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Social Component - Gated by daily goal */}
            <button 
              onClick={() => setShowSocialModal(true)}
              className={`p-4 sm:p-6 border-2 rounded-xl sm:rounded-2xl transition-colors text-left group relative ${
                isGoalReached 
                  ? 'border-green-400 hover:border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center space-x-2">
                  {isGoalReached ? (
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  ) : (
                    <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                  )}
                  {isGoalReached && (
                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                  )}
                </div>
                <ArrowRight className={`w-3 h-3 sm:w-4 sm:h-4 transition-opacity ${
                  isGoalReached ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
                }`} />
              </div>
              <h3 className={`font-medium mb-1 text-sm sm:text-base ${
                isGoalReached ? 'text-green-800' : 'text-gray-500'
              }`}>
                {isGoalReached ? 'Social Hub' : 'Social Hub'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                {isGoalReached 
                  ? 'Share achievements and connect with community' 
                  : `Complete your goal to unlock (${(dailyGoal - currentSteps).toLocaleString()} steps left)`
                }
              </p>
              {!isGoalReached && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-xl sm:rounded-2xl">
                  <div className="text-center">
                    <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 font-medium">Goal Required</p>
                  </div>
                </div>
              )}
            </button>
            
            <button 
              onClick={() => setShowWearablesPanel(true)}
              className="p-4 sm:p-6 border border-gray-200 rounded-xl sm:rounded-2xl hover:border-gray-300 transition-colors text-left group relative"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                {wearableConnections.some(c => c.connected) && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </div>
              <h3 className="font-medium mb-1 text-sm sm:text-base">Wearables</h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                {wearableConnections.some(c => c.connected) 
                  ? `Connected: ${wearableConnections.filter(c => c.connected).length} device${wearableConnections.filter(c => c.connected).length !== 1 ? 's' : ''}`
                  : 'Connect your fitness devices'
                }
              </p>
            </button>
            
            <button 
              onClick={() => setShowMessagingPanel(true)}
              className="p-4 sm:p-6 border border-gray-200 rounded-xl sm:rounded-2xl hover:border-gray-300 transition-colors text-left group relative"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                {xmtpEnabled && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </div>
              <h3 className="font-medium mb-1 text-sm sm:text-base">Messages</h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Chat with other movers</p>
            </button>
            
            <button 
              onClick={() => setShowRewardsModal(true)}
              className="p-4 sm:p-6 border border-gray-200 rounded-xl sm:rounded-2xl hover:border-gray-300 transition-colors text-left group"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-medium mb-1 text-sm sm:text-base">Earn Rewards</h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Get tokens for completing goals</p>
            </button>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="mb-8 sm:mb-16">
          <h2 className="text-xl sm:text-2xl font-light mb-6 sm:mb-8">Recent Activity</h2>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base">Daily goal completed</p>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">12,450 steps • 2 hours ago</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-medium text-sm sm:text-base">+10 tokens</p>
                <p className="text-xs sm:text-sm text-gray-600">Reward earned</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base">7-day streak achieved</p>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Consistency bonus unlocked</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-medium text-sm sm:text-base">+25 tokens</p>
                <p className="text-xs sm:text-sm text-gray-600">Streak bonus</p>
              </div>
            </div>

            {wearableData && (
              <div className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl">
                <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base">Wearable data synced</p>
                    <p className="text-xs sm:text-sm text-gray-600 capitalize truncate">
                      {wearableData.source.replace('_', ' ')} • {wearableData.steps.toLocaleString()} steps
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs sm:text-sm text-gray-600">{wearableData.lastSync.toLocaleTimeString()}</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base">New message from Alex Walker</p>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Just hit 15K steps! 🚶‍♂️</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs sm:text-sm text-gray-600">5 min ago</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs sm:text-sm text-gray-500 space-y-2">
          <p>Connected to Base Chain</p>
          {address && (
            <div className="flex justify-center">
              {address && (
                <Identity className="inline-flex items-center space-x-1" address={address}>
                  <Name />
                  <Address className="ml-2" />
                </Identity>
              )}
            </div>
          )}
          <p>Secure • Decentralized • Community-driven</p>
          {xmtpEnabled && (
            <p className="text-green-600">🔒 XMTP messaging enabled</p>
          )}
          {wearableConnections.some(c => c.connected) && (
            <p className="text-blue-600">📱 {wearableConnections.filter(c => c.connected).length} wearable{wearableConnections.filter(c => c.connected).length !== 1 ? 's' : ''} connected</p>
          )}
        </footer>
      </main>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 sm:hidden">
          <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium">Menu</h2>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <button
                onClick={() => {
                  setShowWearablesPanel(true);
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <Smartphone className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Wearables</p>
                  <p className="text-sm text-gray-600">
                    {wearableConnections.some(c => c.connected) 
                      ? `${wearableConnections.filter(c => c.connected).length} connected`
                      : 'Connect devices'
                    }
                  </p>
                </div>
                {wearableConnections.some(c => c.connected) && (
                  <div className="w-2 h-2 bg-green-500 rounded-full ml-auto"></div>
                )}
              </button>

              <button
                onClick={() => {
                  setShowMessagingPanel(true);
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Messages</p>
                  <p className="text-sm text-gray-600">Chat with community</p>
                </div>
                {xmtpEnabled && (
                  <div className="w-2 h-2 bg-green-500 rounded-full ml-auto"></div>
                )}
              </button>

              <button
                onClick={() => {
                  setShowSocialModal(true);
                  setShowMobileMenu(false);
                }}
                disabled={!isGoalReached}
                className="w-full flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors disabled:opacity-50"
              >
                {isGoalReached ? <Users className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                <div className="text-left">
                  <p className="font-medium">Social Hub</p>
                  <p className="text-sm text-gray-600">
                    {isGoalReached ? 'Share and connect' : 'Complete goal to unlock'}
                  </p>
                </div>
                {isGoalReached && (
                  <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                )}
              </button>

              <button
                onClick={() => {
                  setShowRewardsModal(true);
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <Gift className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Rewards</p>
                  <p className="text-sm text-gray-600">Earn tokens</p>
                </div>
              </button>

              <div className="pt-4 border-t border-gray-200">
                <Wallet>
                  <ConnectWallet>
                    <div className="w-full bg-gray-100 text-black p-3 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer text-center font-medium">
                      Wallet Settings
                    </div>
                  </ConnectWallet>
                  <WalletDropdown>
                    {address && (
                      <Identity className="px-4 pt-3 pb-2" address={address} hasCopyAddressOnClick>
                        <Avatar />
                        <Name />
                        <Address className={color.foregroundMuted} />
                        <EthBalance />
                      </Identity>
                    )}
                    <WalletDropdownLink
                      icon="wallet"
                      href="https://keys.coinbase.com"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Wallet
                    </WalletDropdownLink>
                    <WalletDropdownDisconnect />
                  </WalletDropdown>
                </Wallet>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wearables Panel */}
      <WearablesPanel
        isOpen={showWearablesPanel}
        onClose={() => setShowWearablesPanel(false)}
        onDataUpdate={(data) => {
          console.log('Wearable data updated:', data);
        }}
      />

      {/* Messaging Panel */}
      <MessagingPanel
        isOpen={showMessagingPanel}
        onClose={() => setShowMessagingPanel(false)}
        currentSteps={currentSteps}
        dailyGoal={dailyGoal}
        isGoalReached={isGoalReached}
        currentStreak={currentStreak}
      />

      {/* Social Hub Modal - Gated Content */}
      <Modal isOpen={showSocialModal} onClose={() => setShowSocialModal(false)} title="Social Hub">
        {!isGoalReached ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-medium mb-3">Complete Your Daily Goal</h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              Unlock the social hub by reaching your daily step goal. Share achievements, connect with the community, and celebrate your progress!
            </p>
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="text-2xl sm:text-3xl font-light mb-2">
                {(dailyGoal - currentSteps).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">steps remaining</div>
            </div>
            <button
              onClick={() => setShowSocialModal(false)}
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors text-sm sm:text-base"
            >
              Keep Walking
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('share')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'share'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Share
              </button>
              <button
                onClick={() => setActiveTab('feed')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'feed'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Community
              </button>
              <button
                onClick={() => setActiveTab('achievements')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'achievements'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Achievements
              </button>
            </div>

            {/* Share Tab */}
            {activeTab === 'share' && (
              <div className="space-y-6">
                {/* Achievement Celebration */}
                <div className="text-center p-6 bg-green-50 rounded-xl border-2 border-green-200">
                  <div className="text-3xl mb-3">🎉</div>
                  <h3 className="text-lg font-medium text-green-800 mb-2">Goal Achieved!</h3>
                  <div className="text-2xl font-light mb-2">{currentSteps.toLocaleString()}</div>
                  <div className="text-sm text-green-700">steps completed today</div>
                  {wearableData && (
                    <div className="mt-2 text-xs text-green-600 capitalize">
                      via {wearableData.source.replace('_', ' ')}
                    </div>
                  )}
                </div>

                {/* Post to Community */}
                <div className="space-y-4">
                  <h4 className="font-medium">Share with Community</h4>
                  <div className="space-y-3">
                    <textarea
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder="Share your achievement with the community..."
                      className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                      rows={3}
                    />
                    <button
                      onClick={handlePostToCommunity}
                      disabled={!newPost.trim()}
                      className="w-full flex items-center justify-center space-x-2 p-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                      <span>Post to Community</span>
                    </button>
                  </div>
                </div>
                
                {/* External Sharing */}
                <div className="space-y-4">
                  <h4 className="font-medium">Share Externally</h4>
                  <div className="space-y-3">
                    <button
                      onClick={() => handleShare('twitter')}
                      className="w-full flex items-center justify-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share on Twitter</span>
                    </button>
                    
                    <button
                      onClick={() => handleShare('copy')}
                      className="w-full flex items-center justify-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      <span>{copySuccess ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                    
                    {navigator.share && (
                      <button
                        onClick={() => handleShare('native')}
                        className="w-full flex items-center justify-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Community Feed Tab */}
            {activeTab === 'feed' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Community Feed</h4>
                  <button className="text-sm text-gray-600 hover:text-black transition-colors">
                    Refresh
                  </button>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {communityFeed.map((post) => (
                    <div key={post.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {post.user.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{post.user}</p>
                          <p className="text-xs text-gray-600">
                            {post.steps.toLocaleString()} steps • {post.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm mb-3">{post.content}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-600">
                        <button className="flex items-center space-x-1 hover:text-red-500 transition-colors">
                          <Heart className="w-3 h-3" />
                          <span>{post.likes}</span>
                        </button>
                        <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
                          <MessageCircle className="w-3 h-3" />
                          <span>{post.comments}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements Tab */}
            {activeTab === 'achievements' && (
              <div className="space-y-4">
                <h4 className="font-medium">Your Achievements</h4>
                
                <div className="space-y-3">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        achievement.earned
                          ? 'border-yellow-400 bg-yellow-50'
                          : 'border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="text-2xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <h5 className={`font-medium text-sm ${
                            achievement.earned ? 'text-yellow-800' : 'text-gray-500'
                          }`}>
                            {achievement.title}
                          </h5>
                          <p className="text-xs text-gray-600">{achievement.description}</p>
                        </div>
                        {achievement.earned && (
                          <CheckCircle2 className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>
                      
                      {achievement.earned && (
                        <div className="mt-3">
                          <button
                            onClick={() => {
                              setNewPost(`🎉 Just earned "${achievement.title}" with ${achievement.steps.toLocaleString()} steps! ${achievement.icon}`);
                              setActiveTab('share');
                            }}
                            className="text-xs bg-yellow-600 text-white px-3 py-1 rounded-md hover:bg-yellow-700 transition-colors"
                          >
                            Share Achievement
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Community Modal */}
      <Modal isOpen={showCommunityModal} onClose={() => setShowCommunityModal(false)} title="Join the Community">
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">Connect with Movers</h3>
            <p className="text-gray-600">Join thousands of people on their wellness journey</p>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => setShowMessagingPanel(true)}
              className="w-full flex items-center justify-center space-x-3 p-3 sm:p-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Open Messages</span>
            </button>
            
            <button className="w-full flex items-center justify-center space-x-3 p-3 sm:p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
              <Share2 className="w-5 h-5" />
              <span>Follow on Twitter</span>
            </button>
            
            <button className="w-full flex items-center justify-center space-x-3 p-3 sm:p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
              <Users className="w-5 h-5" />
              <span>Find Local Groups</span>
            </button>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl">
            <h4 className="font-medium mb-2">Community Stats</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">12,847</div>
                <div className="text-gray-600">Active members</div>
              </div>
              <div>
                <div className="font-medium">2.3M</div>
                <div className="text-gray-600">Steps today</div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Rewards Modal */}
      <Modal isOpen={showRewardsModal} onClose={() => setShowRewardsModal(false)} title="Earn Rewards">
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">Token Rewards</h3>
            <p className="text-gray-600">Earn tokens for completing daily goals and maintaining streaks</p>
          </div>
          
          {isGoalReached ? (
            <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
              <div className="flex items-center space-x-3 mb-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <div className="font-medium text-green-800">Daily Goal Complete!</div>
                  <div className="text-sm text-green-600">You've earned 10 tokens</div>
                </div>
              </div>
              <button
                onClick={handleClaimReward}
                disabled={isPending}
                className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Claiming...' : 'Claim Reward'}
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-xl text-center">
              <div className="text-gray-600 mb-2">Complete your daily goal to earn rewards</div>
              <div className="text-sm text-gray-500">
                {(dailyGoal - currentSteps).toLocaleString()} steps remaining
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <span className="text-sm">Daily Goal</span>
              <span className="font-medium">10 tokens</span>
            </div>
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <span className="text-sm">7-day Streak</span>
              <span className="font-medium">25 tokens</span>
            </div>
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <span className="text-sm">30-day Streak</span>
              <span className="font-medium">100 tokens</span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl">
            <h4 className="font-medium mb-2">Your Balance</h4>
            <div className="flex items-center space-x-2">
              <Circle className="w-4 h-4 text-purple-500 fill-current" />
              <span className="font-medium">{totalTokens} tokens</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default App;