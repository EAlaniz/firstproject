// Cache bust 1738088258
import React, { useState, useEffect } from 'react';
import { useAccount, useBalance, useWalletClient, useDisconnect } from 'wagmi';
import { ENV_CONFIG } from './constants';
import { EnhancedWalletConnector } from './components/EnhancedWalletConnector';
import Modal from './components/Modal';
import { XMTPMessenger } from './xmtp/components/XMTPMessenger';
import { XMTPProvider } from './xmtp/contexts/XMTPContext';
import { useXMTP } from './xmtp/contexts/useXMTPContext';
import { useXMTPClient } from './xmtp/hooks/useXMTP';
import { useHealthData } from './hooks/useHealthData';
import { useWhoop } from './hooks/useWhoop';
import { LandingPage, DashboardHeader, StepsCard } from './components/pages';
import { WearablesManager } from './components/WearablesManager';
import { BottomTabNav, type TabView } from './components/BottomTabNav';
import { TodayTab } from './components/tabs/TodayTab';
import { ConnectTab } from './components/tabs/ConnectTab';
import { RewardsTab } from './components/tabs/RewardsTab';
import { Activity, Circle, MessageCircle, X, User, ExternalLink, Settings, Lock, LogOut, RefreshCw, Zap } from 'lucide-react';
// Import the Farcaster Frame SDK for mini app splash screen control
import { sdk } from '@farcaster/frame-sdk';
import { Toaster } from 'react-hot-toast';

function AppContent() {
  // Debug: Check environment variables on component mount
  useEffect(() => {
    console.log('🔍 Environment Variables Check:');
    console.log('VITE_WHOOP_CLIENT_ID:', import.meta.env.VITE_WHOOP_CLIENT_ID || 'NOT SET');
    console.log('VITE_WHOOP_CLIENT_SECRET:', import.meta.env.VITE_WHOOP_CLIENT_SECRET ? 'SET (hidden)' : 'NOT SET');
    console.log('VITE_WHOOP_REDIRECT_URI:', import.meta.env.VITE_WHOOP_REDIRECT_URI || 'NOT SET');
  }, []);

  // your existing state hooks
  const [showWalletConnector, setShowWalletConnector] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'messages'>('dashboard');
  const [activeTab, setActiveTab] = useState<'today' | 'connect' | 'rewards'>('today');
  const [dailyGoal, setDailyGoal] = useState(10000);
  const [currentStreak] = useState(12);
  const [totalTokens] = useState(156);

  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address: address });
  const { data: walletClient } = useWalletClient();
  const { disconnect } = useDisconnect();

  // Health data integration - replaces mock step counter
  const {
    todaySteps,
    stepData,
    isLoading: isLoadingSteps,
    error: healthError,
    hasPermission,
    isNative,
    requestPermissions,
    refreshSteps,
    openHealthSettings,
  } = useHealthData();

  // Whoop integration
  const {
    isConnected: isWhoopConnected,
    isConnecting: isWhoopConnecting,
    error: whoopError,
    userData: whoopData,
    connectWhoop,
    disconnectWhoop,
    refreshData: refreshWhoopData,
  } = useWhoop();

  // Add this useEffect near the top inside your component
  useEffect(() => {
    // Dev-only mock for window.farcaster.isMiniApp if undefined
    if (!window.farcaster) {
      window.farcaster = { isMiniApp: true };
      console.warn('Mocking window.farcaster.isMiniApp for local dev');
    }

    (async () => {
      try {
        await sdk.actions.ready();
        sdk.back.enableWebNavigation();
        console.log('✅ Farcaster sdk.actions.ready() and sdk.back.enableWebNavigation() called successfully');
      } catch (err) {
        console.error('❌ Failed to call Farcaster SDK ready or navigation enable', err);
      }
    })();
  }, []);
  // Use XMTP context
  const {
    initialize: initializeClient,
    isConnecting: isInitializing
  } = useXMTP();
  const xmtpClient = useXMTPClient();

  // Debug modal state
  useEffect(() => {
    console.log('Modal state changed:', { showWalletConnector, isConnected });
  }, [showWalletConnector, isConnected]);

  // Update wallet connection state
  useEffect(() => {
    console.log('Wallet state updated:', { isConnected, address, walletClient: !!walletClient });
  }, [isConnected, address, walletClient]);

  const prevIsConnected = React.useRef(isConnected);

  useEffect(() => {
    if (!prevIsConnected.current && isConnected && showWalletConnector) {
      setShowWalletConnector(false); // Only close on new connection
    }
    prevIsConnected.current = isConnected;
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

  // Function to handle goal changes
  const handleGoalChange = (newGoal: number) => {
    setDailyGoal(newGoal);
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
      console.log('✅ XMTP client already initialized, switching to messages view');
      setActiveView('messages');
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

      await initializeClient(walletClient);
      console.log('✅ XMTP initialized successfully');
      setSuccess('XMTP messaging enabled successfully!');

      // Don't switch view immediately - wait for client to be ready
      console.log('⏳ Waiting for XMTP client to be ready...');
    } catch (error) {
      console.error('❌ XMTP initialization failed:', error);
      setError('XMTP setup failed. Please try again.');
    }
  };

  // Auto-switch to messages view after XMTP client is initialized
  const prevXmtpClient = React.useRef(xmtpClient);
  useEffect(() => {
    // Only switch when client transitions from null to initialized
    if (!prevXmtpClient.current && xmtpClient && isConnected) {
      console.log('✅ XMTP client is ready, switching to messages view');
      setActiveView('messages');
    }
    prevXmtpClient.current = xmtpClient;
  }, [xmtpClient, isConnected]);

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
        <LandingPage
          onGetStarted={() => {
            console.log('Get Started button clicked');
            setShowWalletConnector(true);
          }}
        />
      ) : (
        // Main dashboard for connected users
        <>
          <DashboardHeader
            address={address}
            activeView={activeView}
            isInitialized={xmtpClient !== null}
            isInitializing={isInitializing}
            onMenuClick={() => setIsMobileMenuOpen(true)}
            onMessagesClick={() => setActiveView('messages')}
            onWalletClick={() => setShowWalletConnector(true)}
            onInitializeXMTP={handleXMTPInitialization}
          />

          {/* Main Content */}
          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
            {/* Tab-based content */}
            {activeTab === 'today' && (
              <TodayTab
                todaySteps={todaySteps}
                dailyGoal={dailyGoal}
                currentStreak={currentStreak}
                totalTokens={totalTokens}
                onGoalChange={handleGoalChange}
                isNative={isNative}
                hasPermission={hasPermission}
                isLoadingSteps={isLoadingSteps}
                healthError={healthError}
                stepDataSource={stepData?.source || 'mock'}
                requestPermissions={requestPermissions}
                refreshSteps={refreshSteps}
                openHealthSettings={openHealthSettings}
                isWhoopConnected={isWhoopConnected}
                isWhoopConnecting={isWhoopConnecting}
                whoopError={whoopError}
                whoopData={whoopData}
                connectWhoop={connectWhoop}
                disconnectWhoop={disconnectWhoop}
                refreshWhoopData={refreshWhoopData}
              />
            )}

            {activeTab === 'connect' && (
              <ConnectTab
                xmtpClient={xmtpClient}
                isInitializing={isInitializing}
                onInitializeXMTP={handleXMTPInitialization}
                todaySteps={todaySteps}
                dailyGoal={dailyGoal}
                onShare={handleShare}
              />
            )}

            {activeTab === 'rewards' && (
              <RewardsTab
                totalTokens={totalTokens}
                currentStreak={currentStreak}
                address={address}
                balance={balance}
              />
            )}

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
                      onClick={() => {
                        setActiveTab('today');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        activeTab === 'today' ? 'bg-black text-white' : 'hover:bg-gray-50'
                      }`}
                    >
                      <Activity className="w-5 h-5" />
                      <span>Today</span>
                    </button>
                    <button
                      onClick={() => {
                        if (xmtpClient) {
                          setActiveTab('connect');
                          setIsMobileMenuOpen(false);
                        } else {
                          handleXMTPInitialization();
                          setIsMobileMenuOpen(false);
                        }
                      }}
                      disabled={isInitializing}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        isInitializing
                          ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
                          : activeTab === 'connect'
                          ? 'bg-black text-white'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>{isInitializing ? 'Initializing...' : xmtpClient ? 'Connect' : 'Enable Messages'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('rewards');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        activeTab === 'rewards' ? 'bg-black text-white' : 'hover:bg-gray-50'
                      }`}
                    >
                      <Trophy className="w-5 h-5" />
                      <span>Rewards</span>
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

          {/* Bottom Tab Navigation */}
          <BottomTabNav
            activeTab={activeTab}
            onTabChange={(tab: TabView) => setActiveTab(tab)}
          />
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
                        {parseFloat(balance.formatted).toFixed(4)} {balance?.symbol}
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
      <Toaster position="top-center" />
      <AppContent />
    </XMTPProvider>
  );
}

export default App;
// Cache bust 1761671665
