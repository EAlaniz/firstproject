import React from 'react';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import { useAccount, useDisconnect } from 'wagmi';
import { User, LogOut } from 'lucide-react';
import { detectEnvironment } from '../utils/environment';

interface MiniAppWalletConnectorProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'button' | 'icon' | 'text';
  onOpenModal?: () => void;
}

export const MiniAppWalletConnector: React.FC<MiniAppWalletConnectorProps> = ({
  className = '',
  children = null,
  variant = 'button',
  onOpenModal = undefined
}) => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { isFarcasterMiniApp, platform, detectionMethods } = detectEnvironment();

  // Log environment info for debugging
  React.useEffect(() => {
    console.log('🔍 MiniAppWalletConnector Environment:', {
      isFarcasterMiniApp,
      platform,
      detectionMethods,
      isConnected,
      address: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null
    });
  }, [isFarcasterMiniApp, platform, detectionMethods, isConnected, address]);

  // In mini app environment, show a simplified connection state
  if (isFarcasterMiniApp) {
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
            <div className="text-xs text-green-600">Connected to {platform}</div>
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
            <div className="text-xs text-gray-500">{platform} Mini App</div>
          </div>
        </div>
      );
    }
  }

  // If onOpenModal is provided, render a button that opens the modal
  if (onOpenModal) {
    return (
      <button
        onClick={onOpenModal}
        className={`bg-gray-100 text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors cursor-pointer text-sm flex items-center space-x-2 ${className}`}
      >
        <User className="w-4 h-4" />
        <span>Wallet</span>
      </button>
    );
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