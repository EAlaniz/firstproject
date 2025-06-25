import React, { useEffect, useState } from 'react';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import { useAccount, useDisconnect, useWalletClient } from 'wagmi';
import { User, LogOut, MessageCircle, Loader2, Smartphone, Monitor, Zap } from 'lucide-react';
import { useXMTP } from '../contexts/XMTPContext';

// Enhanced environment detection
export const getEnvironmentInfo = () => {
  const isFarcaster = (
    window.location.hostname.includes('farcaster.xyz') ||
    window.location.hostname.includes('warpcast.com') ||
    window.location.hostname.includes('wrpcd.net') ||
    window.location.search.includes('fid=') ||
    window.location.search.includes('farcaster=') ||
    window.navigator.userAgent.includes('Farcaster') ||
    window.navigator.userAgent.includes('Warpcast') ||
    window.location.search.includes('miniApp=true') ||
    window.location.pathname.includes('/miniapp') ||
    window.location.search.includes('frame=') ||
    window.location.search.includes('embed=') ||
    window.location.hostname.includes('preview') ||
    window.location.hostname.includes('debug')
  );

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isDesktop = !isMobile && !isFarcaster;

  return {
    isFarcaster,
    isMobile,
    isDesktop,
    environment: isFarcaster ? 'farcaster' : isMobile ? 'mobile' : 'desktop'
  };
};

// Legacy function for backward compatibility
export const isFarcasterMiniApp = () => getEnvironmentInfo().isFarcaster;

interface EnhancedWalletConnectorProps {
  className?: string;
  children?: React.ReactNode;
  onOpenModal?: () => void;
}

export const EnhancedWalletConnector: React.FC<EnhancedWalletConnectorProps> = ({
  className = '',
  children = null,
  onOpenModal = undefined
}) => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { disconnect } = useDisconnect();
  const { isRegistered, isInitializing, initializeClient } = useXMTP();
  const [isAutoInitializing, setIsAutoInitializing] = useState(false);
  const [autoInitAttempted, setAutoInitAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isFarcaster, isMobile, isDesktop, environment } = getEnvironmentInfo();

  // Environment-specific auto-initialization logic
  useEffect(() => {
    const autoInitializeXMTP = async () => {
      // Only attempt auto-initialization once per connection
      if (autoInitAttempted) return;
      
      // More strict conditions to prevent double initialization
      if (isConnected && address && walletClient && !isRegistered && !isInitializing && !isAutoInitializing && !error) {
        console.log(`[Wallet] Auto-initializing XMTP for ${environment} environment:`, address);
        setIsAutoInitializing(true);
        setAutoInitAttempted(true);
        
        try {
          const { ethers } = await import('ethers');
          const provider = new ethers.BrowserProvider(walletClient);
          const signer = await provider.getSigner();
          
          await initializeClient(signer);
          console.log(`[Wallet] XMTP auto-initialization successful in ${environment}`);
        } catch (error) {
          console.error(`[Wallet] XMTP auto-initialization failed in ${environment}:`, error);
          // Environment-specific error handling
          if (isFarcaster) {
            console.log('[Wallet] Farcaster environment - user can manually initialize later');
          } else if (isMobile) {
            console.log('[Wallet] Mobile environment - user can manually initialize later');
          } else {
            console.log('[Wallet] Desktop environment - user can manually initialize later');
          }
          setError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
          setIsAutoInitializing(false);
        }
      }
    };

    autoInitializeXMTP();
  }, [isConnected, address, walletClient, isRegistered, isInitializing, isAutoInitializing, autoInitAttempted, initializeClient, environment, isFarcaster, isMobile, isDesktop, error]);

  // Reset auto-init attempt when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setAutoInitAttempted(false);
      setError(null);
    }
  }, [isConnected]);

  // Farcaster Mini App Environment
  if (isFarcaster) {
    if (isConnected && address) {
      return (
        <div className={`flex items-center space-x-2 ${className}`}>
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <Zap className="w-4 h-4 text-purple-600" />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium">
              {address.slice(0, 6)}...{address.slice(-4)}
            </div>
            <div className="text-xs text-purple-600 flex items-center space-x-1">
              {isAutoInitializing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Setting up messaging...</span>
                </>
              ) : isRegistered ? (
                <>
                  <MessageCircle className="w-3 h-3" />
                  <span>Ready to chat</span>
                </>
              ) : (
                <span>Connected to Farcaster</span>
              )}
            </div>
          </div>
          <button
            onClick={() => disconnect()}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Disconnect"
          >
            <LogOut className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      );
    } else {
      return (
        <div className={`flex items-center space-x-2 ${className}`}>
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <Zap className="w-4 h-4 text-gray-400" />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium">Not Connected</div>
            <div className="text-xs text-gray-500">Farcaster Mini App</div>
          </div>
        </div>
      );
    }
  }

  // Mobile Web Environment
  if (isMobile) {
    if (isConnected && address) {
      return (
        <div className={`flex flex-col items-center space-y-1 ${className}`}>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-blue-600" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-medium">
                {address.slice(0, 6)}...{address.slice(-4)}
              </div>
            </div>
            <button
              onClick={() => disconnect()}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Disconnect"
            >
              <LogOut className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          {/* XMTP Status */}
          {isInitializing && (
            <div className="text-xs text-blue-500 mt-1 text-center">
              <Loader2 className="w-3 h-3 inline-block animate-spin mr-1" /> Setting up messaging...
            </div>
          )}
          {isRegistered && !isInitializing && (
            <div className="text-xs text-green-600 mt-1 text-center">
              <MessageCircle className="w-3 h-3 inline-block mr-1" /> Ready to chat on XMTP!
            </div>
          )}
          {!isRegistered && !isInitializing && (
            <div className="text-xs text-gray-500 mt-1 text-center">
              Messaging unavailable. Connect wallet and complete setup.
            </div>
          )}
          {error && (
            <div className="text-xs text-red-500 mt-1 text-center">{error}</div>
          )}
        </div>
      );
    } else {
      return (
        <div className="relative flex flex-col items-center">
          <ConnectWallet>
            <button className={`bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors flex items-center space-x-2 ${className}`}>
              <Smartphone className="w-4 h-4" />
              <span>Connect Wallet</span>
            </button>
          </ConnectWallet>
          <div className="text-xs text-gray-500 mt-2 text-center">
            You'll be redirected to the Coinbase Wallet app to connect securely.
          </div>
        </div>
      );
    }
  }

  // Desktop Web Environment
  if (onOpenModal) {
    return (
      <div className={`flex flex-col items-center space-y-1 ${className}`}>
        <button
          onClick={onOpenModal}
          className="bg-gray-100 text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors cursor-pointer text-sm flex items-center space-x-2"
        >
          <User className="w-4 h-4" />
          <span>Wallet</span>
        </button>
        {/* XMTP Status */}
        {isInitializing && (
          <div className="text-xs text-blue-500 mt-1 text-center">
            <Loader2 className="w-3 h-3 inline-block animate-spin mr-1" /> Setting up messaging...
          </div>
        )}
        {isRegistered && !isInitializing && (
          <div className="text-xs text-green-600 mt-1 text-center">
            <MessageCircle className="w-3 h-3 inline-block mr-1" /> Ready to chat on XMTP!
          </div>
        )}
        {!isRegistered && !isInitializing && (
          <div className="text-xs text-gray-500 mt-1 text-center">
            Messaging unavailable. Connect wallet and complete setup.
          </div>
        )}
        {error && (
          <div className="text-xs text-red-500 mt-1 text-center">{error}</div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <ConnectWallet>
        {children || (
          <button className={`bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors flex items-center space-x-2 ${className}`}>
            <Monitor className="w-4 h-4" />
            <span>Connect Wallet</span>
          </button>
        )}
      </ConnectWallet>
      
      {/* Status indicator for desktop users */}
      {isConnected && address && (
        <div className="absolute -bottom-6 left-0 right-0 text-center">
          <div className="text-xs text-gray-600 flex items-center justify-center space-x-1">
            {isAutoInitializing ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Setting up messaging...</span>
              </>
            ) : isRegistered ? (
              <>
                <MessageCircle className="w-3 h-3" />
                <span>Ready to chat</span>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedWalletConnector;
