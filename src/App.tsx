import React, { useState, useEffect } from 'react';
import { useConfig, useAccount, useBalance, useWalletClient } from 'wagmi';
import { APP_CONFIG, ENV_CONFIG } from './constants';
import Header from './components/Header';
import StepTracker from './components/StepTracker';
import Modal from './components/Modal';
import { EnhancedWalletConnector } from './components/EnhancedWalletConnector';
import XMTPMessaging from './components/XMTPMessaging';
import XMTPDiagnostics from './components/XMTPDiagnostics';
import { initXMTP } from './xmtpClient';

function App() {
  // Test wagmi config to ensure provider is working
  const config = useConfig();
  console.log('Wagmi config found:', !!config);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  const [showWalletConnector, setShowWalletConnector] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showXMTPMessaging, setShowXMTPMessaging] = useState(false);
  const [showXMTPDiagnostics, setShowXMTPDiagnostics] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [currentSteps, setCurrentSteps] = useState(7240);
  const [dailyGoal, setDailyGoal] = useState(10000);
  const [currentStreak, setCurrentStreak] = useState(12);
  const [totalTokens, setTotalTokens] = useState(156);

  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address: address });
  const { data: walletClient } = useWalletClient();

  // Update wallet connection state
  useEffect(() => {
    setIsWalletConnected(isConnected);
    setWalletAddress(address || null);
  }, [isConnected, address]);

  // Initialize XMTP immediately after wallet connect
  useEffect(() => {
    if (isConnected && address && walletClient) {
      initXMTP(walletClient)
        .then(() => {
          console.log('XMTP initialized after wallet connect');
        })
        .catch((e) => {
          setError('XMTP setup failed. Please sign the message to enable messaging.');
        });
    }
  }, [isConnected, address, walletClient]);

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

  const handleStepComplete = (step: number) => {
    setCurrentStep(step + 1);
    setSuccess(`Step ${step + 1} completed!`);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setIsLoading(false);
  };

  const handleSuccess = (successMessage: string) => {
    setSuccess(successMessage);
    setIsLoading(false);
  };

  const openModal = (content: React.ReactNode) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
  };

  const handleWalletConnect = () => {
    setShowWalletConnector(true);
  };

  const handleWalletDisconnect = () => {
    setIsWalletConnected(false);
    setWalletAddress(null);
    setSuccess('Wallet disconnected successfully');
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome to {APP_CONFIG.name}
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Track your daily steps, earn rewards, and connect with friends in the decentralized wellness community.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">🚶‍♂️ Step Tracking</h3>
                <p className="text-blue-700 text-sm">
                  Connect your wallet to start tracking your daily steps and earning rewards.
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">💰 Token Rewards</h3>
                <p className="text-green-700 text-sm">
                  Earn tokens for achieving your daily step goals and maintaining streaks.
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">🤝 Social Connection</h3>
                <p className="text-purple-700 text-sm">
                  Share your progress and connect with friends in the wellness community.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => handleStepComplete(0)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        );
        
      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Connect Your Wallet
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Connect your wallet to start tracking steps and earning rewards on Base Chain.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-2">🔗 Wallet Connection</h3>
                <p className="text-yellow-700 text-sm">
                  We support Coinbase Wallet for seamless integration with Base Chain.
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">⚡ Base Chain</h3>
                <p className="text-blue-700 text-sm">
                  Built on Base Chain for fast, low-cost transactions and excellent user experience.
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleWalletConnect}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors w-full"
              >
                Connect Wallet
              </button>
              
              {isWalletConnected && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-700 text-sm">
                    ✅ Wallet connected: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                  </p>
                  <button
                    onClick={() => handleStepComplete(1)}
                    className="mt-2 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Start Tracking Steps
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Your step tracker is ready! Set your daily goal and start earning rewards.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">🎯 Daily Goals</h3>
                <p className="text-green-700 text-sm">
                  Set and achieve daily step goals to earn tokens and build streaks.
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">📊 Progress Tracking</h3>
                <p className="text-purple-700 text-sm">
                  Monitor your progress with real-time step counting and statistics.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => handleStepComplete(2)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start Tracking
            </button>
          </div>
        );
        
      default:
        return null;
    }
  };

  const handleShare = async (platform: string, text: string) => {
    try {
      switch (platform) {
        case 'twitter':
          const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
          window.open(twitterUrl, '_blank');
          break;
        case 'copy':
          await navigator.clipboard.writeText(text);
          setSuccess('Link copied to clipboard!');
          break;
        case 'native':
          if (navigator.share) {
            await navigator.share({
              title: APP_CONFIG.name,
              text: text,
              url: window.location.href,
            });
          } else {
            await navigator.clipboard.writeText(text);
            setSuccess('Link copied to clipboard!');
          }
          break;
        default:
          throw new Error('Unsupported platform');
      }
    } catch (error) {
      console.error('Share error:', error);
      setError('Failed to share. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <Header 
        currentStreak={currentStreak}
        totalTokens={totalTokens}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Onboarding Steps */}
        {currentStep < 3 && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              {getStepContent(currentStep)}
            </div>
          </div>
        )}

        {/* Step Tracker */}
        {isWalletConnected && currentStep >= 2 && (
          <div className="max-w-4xl mx-auto">
            <StepTracker 
              currentSteps={currentSteps}
              dailyGoal={dailyGoal}
              onGoalChange={setDailyGoal}
            />
          </div>
        )}

        {/* Wallet Connection Prompt */}
        {!isWalletConnected && currentStep >= 2 && (
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Connect Your Wallet
              </h2>
              <p className="text-gray-600 mb-6">
                Connect your wallet to start tracking steps and earning rewards.
              </p>
              <button
                onClick={handleWalletConnect}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {isWalletConnected && (
          <div className="max-w-4xl mx-auto mt-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setShowXMTPMessaging(true)}
                  className="bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  💬 Open Messaging
                </button>
                <button
                  onClick={() => setShowXMTPDiagnostics(true)}
                  className="bg-orange-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                >
                  🔧 XMTP Diagnostics
                </button>
                <button
                  onClick={() => handleShare('copy', `Check out my progress on ${APP_CONFIG.name}! 🚶‍♂️`)}
                  className="bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  📤 Share Progress
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Wallet Connector Modal */}
      {showWalletConnector && (
        <Modal 
          isOpen={showWalletConnector} 
          onClose={() => setShowWalletConnector(false)}
          title="Connect Wallet"
        >
          <EnhancedWalletConnector />
        </Modal>
      )}

      {/* XMTP Messaging */}
      <XMTPMessaging 
        isOpen={showXMTPMessaging} 
        onClose={() => setShowXMTPMessaging(false)} 
      />

      {/* XMTP Diagnostics */}
      <XMTPDiagnostics 
        isOpen={showXMTPDiagnostics} 
        onClose={() => setShowXMTPDiagnostics(false)} 
      />

      {/* Error Modal */}
      {error && (
        <Modal isOpen={!!error} onClose={() => setError(null)} title="Error">
          <div className="p-6">
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => setError(null)}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Success Modal */}
      {success && (
        <Modal isOpen={!!success} onClose={() => setSuccess(null)} title="Success">
          <div className="p-6">
            <p className="text-green-700 mb-4">{success}</p>
            <button
              onClick={() => setSuccess(null)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* General Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title="Modal">
        {modalContent}
      </Modal>
    </div>
  );
}

export default App;
// Clean build Mon Jun 23 21:20:26 PDT 2025
