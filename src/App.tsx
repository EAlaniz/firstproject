import React, { useState, useEffect } from 'react';
import { useAccount, useBalance, useWalletClient } from 'wagmi';
import { XMTPProvider } from './xmtp/contexts/XMTPContext';
import { useXMTP } from './xmtp/contexts/useXMTPContext';
import { useXMTPClient } from './xmtp/hooks/useXMTP';
import { useHealthData } from './hooks/useHealthData';
import { useWhoop } from './hooks/useWhoop';
import { useIsBaseMiniApp } from './hooks/useIsBaseMiniApp';
import { LandingPage, DashboardHeader } from './components/pages';
import { BottomTabNav, type TabView } from './components/BottomTabNav';
import { TodayTab } from './components/tabs/TodayTab';
import { ConnectTab } from './components/tabs/ConnectTab';
import { RewardsTab } from './components/tabs/RewardsTab';
import { Toaster } from 'react-hot-toast';

function AppContent() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'messages'>('dashboard');
  const [activeTab, setActiveTab] = useState<'today' | 'connect' | 'rewards'>('today');
  const [dailyGoal, setDailyGoal] = useState(10000);
  const [currentStreak] = useState(12);
  const [totalTokens] = useState(156);

  const { address, isConnected, isConnecting } = useAccount();
  const { data: balance } = useBalance({ address: address });
  const { data: walletClient } = useWalletClient();
  const { isMiniApp, ready: miniAppReady } = useIsBaseMiniApp();

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

  // Use XMTP context
  const {
    initialize: initializeClient,
    isConnecting: isInitializing
  } = useXMTP();
  const xmtpClient = useXMTPClient();

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
      setActiveView('messages');
    }
    prevXmtpClient.current = xmtpClient;
  }, [xmtpClient, isConnected]);


  // In mini apps, OnchainKit's miniKit auto-connects the wallet
  // Show dashboard immediately in mini apps (wallet will auto-connect)
  // On web, show landing page if not connected
  const shouldShowDashboard = isMiniApp ? true : isConnected;

  // Main return with conditional rendering
  return (
    <div className="min-h-screen bg-black text-white">
      {shouldShowDashboard ? (
        // Main dashboard for connected users
        <>
          <DashboardHeader
            activeView={activeView}
            isInitialized={xmtpClient !== null}
            isInitializing={isInitializing}
            onMessagesClick={() => setActiveView('messages')}
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
          </main>

          {/* Bottom Tab Navigation */}
          <BottomTabNav
            activeTab={activeTab}
            onTabChange={(tab: TabView) => setActiveTab(tab)}
          />
        </>
      ) : (
        <LandingPage />
      )}

      {/* Modals - Rendered outside conditional so they work on both landing page and dashboard */}

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
