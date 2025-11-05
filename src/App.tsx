import React, { useState, useEffect } from 'react';
import { useAccount, useBalance, useWalletClient } from 'wagmi';
import { useHealthData } from './hooks/useHealthData';
import { useIsBaseMiniApp } from './hooks/useIsBaseMiniApp';
import { LandingPage, DashboardHeader } from './components/pages';
import { BottomTabNav, type TabView } from './components/BottomTabNav';
import { TodayTab } from './components/tabs/TodayTab';
import { ConnectTab } from './components/tabs/ConnectTab';
import { RewardsTab } from './components/tabs/RewardsTab';
import { Toaster } from 'react-hot-toast';
import { MiniAppReady } from './components/MiniAppReady';

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

  // Whoop removed for lean foundation

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

  // Messaging removed for lean foundation


  // In mini apps, OnchainKit's miniKit auto-connects the wallet
  // Show dashboard immediately in mini apps (wallet will auto-connect)
  // On web, show landing page if not connected
  const shouldShowDashboard = isMiniApp ? true : isConnected;

  // Main return with conditional rendering
  return (
    <div className={`${isMiniApp ? '' : 'min-h-screen'} bg-black text-white`}>
      {shouldShowDashboard ? (
        // Main dashboard for connected users
        <>
          <DashboardHeader activeView={activeView} isInitialized={false} isInitializing={false} onMessagesClick={() => {}} onInitializeXMTP={() => {}} />

          {/* Main Content */}
          <main className="max-w-6xl mx-auto"
            style={{
              paddingLeft: isMiniApp ? 'var(--space-2)' : 'var(--space-4)',
              paddingRight: isMiniApp ? 'var(--space-2)' : 'var(--space-4)',
              paddingTop: isMiniApp ? 'var(--space-1)' : 'var(--space-8)',
              paddingBottom: '0',
              marginBottom: isMiniApp ? '80px' : '80px',
            }}
          >
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
              />
            )}

            {activeTab === 'connect' && (
              <ConnectTab todaySteps={todaySteps} dailyGoal={dailyGoal} onShare={handleShare} />
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

      {/* Status Indicator */}
    </div>
  );
}

// Main App component
function App() {
  return (
    <>
      <Toaster position="top-center" />
      <MiniAppReady />
      <AppContent />
    </>
  );
}

export default App;
// Cache bust 1761671665
