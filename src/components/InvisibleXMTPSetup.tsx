import React, { useEffect, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { useXMTP } from '../contexts/XMTPContext';
import { detectEnvironment } from '../utils/environment';

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

  // Track if we've attempted setup for this address
  const setupAttemptedRef = useRef<string | null>(null);

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
  }, [autoSetup, isConnected, address, walletClient, isXMTPSetup, isXMTPSettingUp, initializeClient, onSetupComplete]);

  // Reset setup attempt when address changes
  useEffect(() => {
    if (address !== setupAttemptedRef.current) {
      setupAttemptedRef.current = null;
    }
  }, [address]);

  // This component doesn't render anything visible
  return null;
};

export default InvisibleXMTPSetup; 