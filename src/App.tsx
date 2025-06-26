import React, { useState, useEffect } from 'react';
import { useConfig, useAccount, useBalance, useWalletClient, useDisconnect } from 'wagmi';
import { APP_CONFIG, ENV_CONFIG } from './constants';
import Header from './components/Header';
import StepTracker from './components/StepTracker';
import Modal from './components/Modal';
import { EnhancedWalletConnector } from './components/EnhancedWalletConnector';
import XMTPMessaging from './components/XMTPMessaging';
import XMTPDiagnostics from './components/XMTPDiagnostics';
import { initXMTP } from './xmtpClient';
import { base } from 'wagmi/chains';
import { Activity, Trophy, Circle, MessageCircle, Menu, X } from 'lucide-react';

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
const { disconnect } = useDisconnect();

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
disconnect();
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

// Main dashboard after connect
return (
<div className="min-h-screen bg-white text-black">
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
      onClick={() => setShowXMTPMessaging(true)}
      className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
      title="Messages"
    >
      <MessageCircle className="w-5 h-5" />
    </button>
    <button
      onClick={() => setShowWalletConnector(true)}
      className="bg-gray-100 text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors cursor-pointer text-sm"
    >
      Wallet
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
{showWalletConnector && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
    <div className="bg-white w-full sm:max-w-sm sm:w-full max-h-[90vh] overflow-y-auto sm:rounded-2xl rounded-t-2xl">
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
        <h2 className="text-lg sm:text-xl font-medium">Wallet</h2>
        <button
          onClick={() => setShowWalletConnector(false)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 sm:p-6">
        {address && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium text-sm">
                  {address.slice(2, 4).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Connected Wallet</div>
                <div className="text-gray-500 text-xs font-mono">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </div>
              </div>
            </div>
            {balance && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Balance</div>
                <div className="font-medium">
                  {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                </div>
              </div>
            )}
            <button
              onClick={handleWalletDisconnect}
              className="w-full bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
            >
              Disconnect Wallet
            </button>
          </div>
        )}
        {!address && (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">No wallet connected</div>
            <EnhancedWalletConnector />
          </div>
        )}
      </div>
    </div>
  </div>
)}
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
strokeDashoffset={`${2 * Math.PI * 45 * (1 - (currentSteps / dailyGoal))}`}
className={`transition-all duration-1000 ${
                   currentSteps >= dailyGoal ? 'text-green-500' : 'text-black'
                 }`}
strokeLinecap="round"
/>
</svg>
<div className="absolute inset-0 flex items-center justify-center">
<div className="text-center">
<div className="text-xl sm:text-2xl font-medium">
{Math.round((currentSteps / dailyGoal) * 100)}%
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
</div>
</section>
</main>
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
</div>
);
}

export default App;
