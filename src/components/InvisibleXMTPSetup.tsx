import React, { useEffect } from 'react';
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
    initializeClient
  } = useXMTP();

  // Silent auto-setup XMTP when wallet connects
  useEffect(() => {
    if (autoSetup && isConnected && address && walletClient && !isXMTPSetup && !isXMTPSettingUp) {
      console.log('🔄 Silent XMTP setup for wallet:', address);
      
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
        }
      };

      setupXMTP();
    }
  }, [autoSetup, isConnected, address, walletClient, isXMTPSetup, isXMTPSettingUp, initializeClient, onSetupComplete]);

  // This component doesn't render anything visible
  return null;
};

export default InvisibleXMTPSetup; 