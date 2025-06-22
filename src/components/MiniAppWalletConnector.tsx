import React from 'react';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import { useAccount, useDisconnect } from 'wagmi';
import { User, LogOut } from 'lucide-react';

// Detect if we're in a Farcaster mini app environment
const isFarcasterMiniApp = () => {
  return (
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
};

interface MiniAppWalletConnectorProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'button' | 'icon' | 'text';
}

export const MiniAppWalletConnector: React.FC<MiniAppWalletConnectorProps> = ({
  className = '',
  children,
  variant = 'button'
}) => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const isMiniApp = isFarcasterMiniApp();

  // In mini app environment, show a simplified connection state
  if (isMiniApp) {
    if (isConnected && address) {
      return (
        <div className={`flex items-center space-x-2 ${className}`}>
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-green-600" />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium">
              {address.slice(0, 6)}...{address.slice(-4)}
            </div>
            <div className="text-xs text-green-600">Connected</div>
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
            <User className="w-4 h-4 text-gray-400" />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium">Not Connected</div>
            <div className="text-xs text-gray-500">Mini App Mode</div>
          </div>
        </div>
      );
    }
  }

  // In web environment, use the normal ConnectWallet component
  return (
    <ConnectWallet>
      {children || (
        <button className={`bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors flex items-center space-x-2 ${className}`}>
          <User className="w-4 h-4" />
          <span>Connect Wallet</span>
        </button>
      )}
    </ConnectWallet>
  );
};

export default MiniAppWalletConnector; 