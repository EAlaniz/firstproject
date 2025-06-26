import React, { useState, useEffect } from 'react';
import { useAccount, useBalance, useWalletClient, useDisconnect } from 'wagmi';
import { ENV_CONFIG } from './constants';
import { EnhancedWalletConnector } from './components/EnhancedWalletConnector';
import Modal from './components/Modal';
import XMTPMessaging from './components/XMTPMessaging';
import { useXMTP, XMTPProvider } from './contexts/XMTPContext';
import { Activity, Trophy, Circle, MessageCircle, Menu, X, User, ExternalLink, Settings, Lock, LogOut } from 'lucide-react';

// Inner App component that uses XMTP context
function AppContent() {
  const [showWalletConnector, setShowWalletConnector] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showXMTPMessaging, setShowXMTPMessaging] = useState(false);
  const [currentSteps, setCurrentSteps] = useState(7240);
  const [dailyGoal, setDailyGoal] = useState(10000);
  const [currentStreak] = useState(12);
  const [totalTokens] = useState(156);

  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address: address });
  const { data: walletClient } = useWalletClient();
  const { disconnect } = useDisconnect();

  // Use XMTP context
  const { client: xmtpClient, initializeClient, isInitializing } = useXMTP();

  // Debug modal state
  useEffect(() => {
    console.log('Modal state changed:', { showWalletConnector, isConnected });
  }, [showWalletConnector, isConnected]);

  // Update wallet connection state
  useEffect(() => {
    console.log('Wallet state updated:', { isConnected, address, walletClient: !!walletClient });
  }, [isConnected, address, walletClient]);

  // Close wallet modal when wallet connects
  useEffect(() => {
    if (isConnected && showWalletConnector) {
      const timer = setTimeout(() => {
        setShowWalletConnector(false);
      }, 1500); // 1.5 second delay to show success
      return () => clearTimeout(timer);
    }
  }, [isConnected, showWalletConnector]);

  // Clear messages after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Ensure current steps never exceed the daily goal
  useEffect(() => {
    if (currentSteps > dailyGoal) {
      setCurrentSteps(dailyGoal);
    }
  }, [currentSteps, dailyGoal]);

  // Function to handle goal changes and adjust current steps if needed
  const handleGoalChange = (newGoal: number) => {
    setDailyGoal(newGoal);
    // If current steps exceed the new goal, cap them at the goal
    if (currentSteps > newGoal) {
      setCurrentSteps(newGoal);
    }
  };

  const handleShare = async (platform: string, text: string) => {
    try {
      if (platform === 'twitter') {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
        window.open(url, '_blank');
      } else if (platform === 'farcaster') {
        // Farcaster sharing logic
        const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
      }
      setSuccess('Shared successfully!');
    } catch (error) {
      console.error('Share error:', error);
      setError('Failed to share. Please try again.');
    }
  };

  // Function to handle XMTP initialization when user clicks Messages
  const handleXMTPInitialization = async () => {
    if (!isConnected || !address || !walletClient) {
      setError('Please connect your wallet first');
      return;
    }

    if (xmtpClient) {
      // XMTP already initialized, just show the messaging interface
      setShowXMTPMessaging(true);
      return;
    }

    if (isInitializing) {
      setError('XMTP initialization already in progress...');
      return;
    }

    console.log('🚀 User initiated XMTP initialization');
    console.log('🔍 Current wallet state:', {
      address,
      chainId: walletClient.chain?.id,
      chainName: walletClient.chain?.name
    });
    
    // Check if wallet is on Base network
    if (walletClient.chain?.id !== 8453) {
      console.log('⚠️  Wallet not on Base network. Current:', walletClient.chain?.id, 'Expected: 8453');
      setError('Please switch your Coinbase Wallet to Base network before enabling XMTP messaging. You can do this by: 1) Opening Coinbase Wallet extension, 2) Clicking the network selector, 3) Selecting "Base"');
      return;
    }
    
    setError(null);

    try {
      console.log('🔄 Starting XMTP initialization process...');
      console.log('🔄 XMTP is requesting your signature to enable messaging...');
      
      await initializeClient();
      console.log('✅ XMTP initialized successfully');
      setSuccess('XMTP messaging enabled successfully!');
      setShowXMTPMessaging(true);
    } catch (error) {
      console.error('❌ XMTP initialization failed:', error);
      setError('XMTP setup failed. Please try again.');
    }
  };

  // Debug logging for configuration verification
  useEffect(() => {
    console.log('🔧 App Debug Info:');
    console.log('  - RPC URL:', ENV_CONFIG.RPC_URL);
    console.log('  - Is Connected:', isConnected);
    console.log('  - Address:', address);
  }, [isConnected, address]);

  // Main return with conditional rendering
  return (
    <div className="min-h-screen bg-white text-black">
      {!isConnected ? (
        // Landing page for disconnected users
        <>
          {/* Header */}
          <header className="border-b border-gray-200 px-4 sm:px-6 py-4">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-medium">10K</span>
              </div>
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
                <button
                  onClick={() => {
                    console.log('Get Started button clicked');
                    console.log('Current showWalletConnector state:', showWalletConnector);
                    console.log('Current isConnected state:', isConnected);
                    setShowWalletConnector(true);
                    console.log('Set showWalletConnector to true');
                  }}
                  className="bg-black text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:bg-gray-800 transition-colors cursor-pointer font-medium flex items-center space-x-2 w-full sm:w-auto justify-center"
                >
                  <span>Get Started</span>
                </button>
              </div>
              
              <div className="pt-8 sm:pt-12 text-sm text-gray-500">
                Powered by Base Chain • Low fees • Fast transactions
              </div>
            </div>
          </main>
        </>
      ) : (
        // Main dashboard for connected users
        <>
          {/* Header */}
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
                    onClick={() => setShowWalletConnector(true)}
                    className="bg-gray-100 text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors cursor-pointer text-sm"
                  >
                    Wallet
                  </button>
                  <button
                    onClick={handleXMTPInitialization}
                    disabled={isInitializing}
                    className={`px-4 py-2 rounded-full transition-colors cursor-pointer text-sm flex items-center space-x-2 ${
                      xmtpClient 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : isInitializing
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>
                      {xmtpClient ? 'Messages' : isInitializing ? 'Initializing...' : 'Enable Messages'}
                    </span>
                  </button>
                </div>
              </div>
              {/* Mobile Menu Button */}
              <div className="flex items-center space-x-2 sm:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>

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
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - Math.min(currentSteps / dailyGoal, 1))}`}
                      className={`transition-all duration-1000 ${
                        currentSteps >= dailyGoal ? 'text-green-500' : 'text-black'
                      }`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-medium">
                        {Math.min(Math.round((currentSteps / dailyGoal) * 100), 100)}%
                      </div>
                      {currentSteps >= dailyGoal && (
                        <span className="text-green-500 font-semibold">Goal!</span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Goal Selector */}
                <div className="flex justify-center">
                  <select
                    value={dailyGoal}
                    onChange={(e) => handleGoalChange(Number(e.target.value))}
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Social Component - Gated by daily goal */}
                <button
                  onClick={() => {
                    if (currentSteps >= dailyGoal) {
                      handleShare('twitter', 'Share your progress with the community!');
                    }
                  }}
                  disabled={currentSteps < dailyGoal}
                  className={`p-4 sm:p-6 border-2 rounded-xl sm:rounded-2xl transition-colors text-left group relative ${
                    currentSteps >= dailyGoal 
                      ? 'border-green-400 hover:border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center space-x-2">
                      {currentSteps >= dailyGoal ? (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                      {currentSteps >= dailyGoal && (
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <svg className={`w-3 h-3 sm:w-4 sm:h-4 transition-opacity ${
                      currentSteps >= dailyGoal ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h3 className={`font-medium mb-1 text-sm sm:text-base ${
                    currentSteps >= dailyGoal ? 'text-green-800' : 'text-gray-500'
                  }`}>
                    {currentSteps >= dailyGoal ? 'Social Hub' : 'Social Hub'}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                    {currentSteps >= dailyGoal 
                      ? 'Share achievements and connect with community' 
                      : `Complete your goal to unlock (${(dailyGoal - currentSteps).toLocaleString()} steps left)`
                    }
                  </p>
                  {currentSteps < dailyGoal && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-xl sm:rounded-2xl">
                      <div className="text-center">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <p className="text-xs text-gray-500 font-medium">Goal Required</p>
                      </div>
                    </div>
                  )}
                </button>
                
                {/* XMTP Messaging */}
                <button
                  onClick={() => {
                    if (xmtpClient) {
                      setShowXMTPMessaging(true);
                    } else {
                      handleXMTPInitialization();
                    }
                  }}
                  disabled={isInitializing}
                  className={`p-4 sm:p-6 border-2 rounded-xl sm:rounded-2xl transition-colors text-left group relative ${
                    isInitializing 
                      ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
                      : error 
                        ? 'border-red-400 bg-red-50 hover:border-red-500' 
                        : xmtpClient 
                          ? 'border-green-400 bg-green-50 hover:border-green-500' 
                          : 'border-blue-400 hover:border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        isInitializing 
                          ? 'bg-gray-200' 
                          : error 
                            ? 'bg-red-200' 
                            : xmtpClient 
                              ? 'bg-green-200' 
                              : 'bg-blue-200'
                      }`}>
                        <MessageCircle className={`w-5 h-5 ${
                          isInitializing 
                            ? 'text-gray-600' 
                            : error 
                              ? 'text-red-600' 
                              : xmtpClient 
                                ? 'text-green-600' 
                                : 'text-blue-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Messages</h3>
                        <p className="text-sm text-gray-600">
                          {isInitializing 
                            ? 'Initializing messaging...' 
                            : error 
                              ? 'Click to retry setup' 
                              : xmtpClient 
                                ? 'Ready to chat' 
                                : 'Enable secure messaging'
                          }
                        </p>
                      </div>
                    </div>
                    {isInitializing && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                    {xmtpClient && (
                      <div className="text-green-600">
                        <Circle className="w-4 h-4 fill-current" />
                      </div>
                    )}
                    {error && (
                      <div className="text-red-600">
                        <X className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </button>
              
                {/* Rewards */}
                <button
                  onClick={() => {
                    // TODO: Implement rewards modal or page
                    console.log('Rewards clicked');
                  }}
                  className="p-4 sm:p-6 border border-gray-200 rounded-xl sm:rounded-2xl hover:border-gray-300 transition-colors text-left group"
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
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
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
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
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
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

                <div className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl">
                  <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
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
              <p>Connected to Base</p>
              {address && (
                <div className="flex justify-center">
                  <div className="inline-flex items-center space-x-1">
                    <span className="text-sm font-medium">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </span>
                  </div>
                </div>
              )}
              <p>Secure • Decentralized • Community-driven</p>
            </footer>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 sm:hidden">
                <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-xl">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Menu</h2>
                      <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-medium">{address?.slice(0, 6)}...{address?.slice(-4)}</div>
                        <div className="text-sm text-gray-500">{balance?.formatted} {balance?.symbol}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setShowWalletConnector(true);
                      }}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Settings className="w-5 h-5" />
                      <span>Wallet Settings</span>
                    </button>
                    <button
                      onClick={handleXMTPInitialization}
                      disabled={isInitializing}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        xmtpClient 
                          ? 'bg-green-50 text-green-700' 
                          : isInitializing
                          ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>
                        {xmtpClient ? 'Messages' : isInitializing ? 'Initializing...' : 'Enable Messages'}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        disconnect();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-red-600"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Disconnect</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </>
      )}

      {/* Modals - Rendered outside conditional so they work on both landing page and dashboard */}
      
      {/* Wallet Connector Modal */}
      {showWalletConnector && (
        <Modal 
          isOpen={showWalletConnector} 
          onClose={() => {
            console.log('Closing wallet modal');
            setShowWalletConnector(false);
          }}
          title=""
          noHeader={true}
        >
          <div className="flex flex-col items-center justify-center min-h-[140px] py-4">
            {isConnected ? (
              <div className="w-full space-y-3">
                {/* Connected Wallet Info */}
                <div className="bg-gray-50 p-3 rounded-xl">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Connected Wallet</p>
                      <p className="text-xs text-gray-600">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </p>
                    </div>
                  </div>
                  {balance && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Balance:</span>
                      <span className="font-medium">
                        {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                      </span>
                    </div>
                  )}
                </div>

                {/* Wallet Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      window.open('https://keys.coinbase.com', '_blank');
                      setShowWalletConnector(false);
                    }}
                    className="w-full flex items-center justify-center space-x-3 p-2 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Manage Wallet</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      window.open('https://www.coinbase.com/settings', '_blank');
                      setShowWalletConnector(false);
                    }}
                    className="w-full flex items-center justify-center space-x-3 p-2 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Account Settings</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      window.open('https://www.coinbase.com/security', '_blank');
                      setShowWalletConnector(false);
                    }}
                    className="w-full flex items-center justify-center space-x-3 p-2 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Security</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      disconnect();
                      setShowWalletConnector(false);
                    }}
                    className="w-full flex items-center justify-center space-x-3 p-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Disconnect Wallet</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Not Connected - Minimal design */}
                <div className="text-center w-full max-w-sm mx-auto">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-center">Connect Your Wallet</h3>
                  <p className="text-gray-600 mb-4 text-center">Connect your wallet to access all features</p>
                  
                  <div className="flex justify-center">
                    <EnhancedWalletConnector 
                      className="w-full max-w-xs"
                      onWalletClientReady={(client) => {
                        console.log('Wallet client ready:', client);
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* XMTP Messaging Modal */}
      {showXMTPMessaging && (
        <XMTPMessaging
          isOpen={showXMTPMessaging}
          onClose={() => setShowXMTPMessaging(false)}
        />
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          {error}
        </div>
      )}
      {success && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50">
          {success}
        </div>
      )}

      {/* XMTP Status Indicator */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          XMTP Error: {error}
        </div>
      )}
    </div>
  );
}

// Main App component that wraps everything with XMTP provider
function App() {
  return (
    <XMTPProvider>
      <AppContent />
    </XMTPProvider>
  );
}

export default App;
