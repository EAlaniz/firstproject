import React, { useEffect, useRef, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { useXMTP } from '../contexts/XMTPContext';
import { detectEnvironment } from '../utils/environment';
import { checkXMTPCompatibility } from '../utils/walletCompatibility';
import { WalletCompatibilityModal } from './WalletCompatibilityModal';

interface InvisibleXMTPSetupProps {
  autoSetup?: boolean;
  onSetupComplete?: (success: boolean) => void;
}

export const InvisibleXMTPSetup: React.FC<InvisibleXMTPSetupProps> = ({
  autoSetup = true,
  onSetupComplete
}) => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { isFarcasterMiniApp } = detectEnvironment();
  
  // XMTP context
  const { 
    isRegistered: isXMTPSetup, 
    isInitializing: isXMTPSettingUp, 
    initializeClient,
    error: xmtpError
  } = useXMTP();

  // Wallet compatibility state
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false);
  const [compatibilityChecked, setCompatibilityChecked] = useState(false);

  // Track if we've attempted setup for this address
  const setupAttemptedRef = useRef<string | null>(null);

  // Check wallet compatibility
  const walletCompatibility = checkXMTPCompatibility();

  // Silent auto-setup XMTP when wallet connects
  useEffect(() => {
    if (autoSetup && 
        isConnected && 
        address && 
        walletClient && 
        !isXMTPSetup && 
        !isXMTPSettingUp && 
        setupAttemptedRef.current !== address) {
      
      console.log('🔄 Silent XMTP setup for wallet:', address);
      console.log('🔍 Wallet compatibility check:', walletCompatibility);
      
      // Check wallet compatibility first
      if (!walletCompatibility.isXMTPCompatible) {
        console.log('❌ Wallet not compatible with XMTP:', walletCompatibility.walletType);
        setShowCompatibilityModal(true);
        setCompatibilityChecked(true);
        onSetupComplete?.(false);
        return;
      }

      setCompatibilityChecked(true);
      setupAttemptedRef.current = address;
      
      const setupXMTP = async () => {
        try {
          const { ethers } = await import('ethers');
          const provider = new ethers.BrowserProvider(walletClient);
          const signer = await provider.getSigner();
          
          await initializeClient(signer);
          console.log('✅ Silent XMTP setup completed');
          onSetupComplete?.(true);
          
        } catch (error) {
          console.error('❌ Silent XMTP setup failed:', error);
          onSetupComplete?.(false);
          // Reset the attempt ref so user can try again
          setupAttemptedRef.current = null;
        }
      };

      setupXMTP();
    }
  }, [autoSetup, isConnected, address, walletClient, isXMTPSetup, isXMTPSettingUp, initializeClient, onSetupComplete, walletCompatibility]);

  // Reset setup attempt when address changes
  useEffect(() => {
    if (address !== setupAttemptedRef.current) {
      setupAttemptedRef.current = null;
      setCompatibilityChecked(false);
    }
  }, [address]);

  // Handle retry from compatibility modal
  const handleRetry = () => {
    setShowCompatibilityModal(false);
    setCompatibilityChecked(false);
    setupAttemptedRef.current = null;
  };

  return (
    <>
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black text-white p-3 rounded-lg text-xs max-w-xs z-50">
          <div>XMTP Setup Status:</div>
          <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
          <div>Address: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'None'}</div>
          <div>XMTP Setup: {isXMTPSetup ? 'Complete' : 'Pending'}</div>
          <div>Compatibility: {walletCompatibility.isXMTPCompatible ? '✅' : '❌'}</div>
          <div>Wallet Type: {walletCompatibility.walletType}</div>
          {xmtpError && <div className="text-red-400">Error: {xmtpError}</div>}
        </div>
      )}

      {/* Wallet Compatibility Modal */}
      <WalletCompatibilityModal
        isOpen={showCompatibilityModal}
        onClose={() => setShowCompatibilityModal(false)}
        onRetry={handleRetry}
      />
    </>
  );
};

export default InvisibleXMTPSetup; 