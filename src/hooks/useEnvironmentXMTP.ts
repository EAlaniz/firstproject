import { useEffect, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { useXMTP } from '../contexts/XMTPContext';
import { getEnvironmentInfo } from '../components/EnhancedWalletConnector';

export const useEnvironmentXMTP = () => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { isRegistered, isInitializing, initializeClient } = useXMTP();
  const [isAutoInitializing, setIsAutoInitializing] = useState(false);
  const [autoInitAttempted, setAutoInitAttempted] = useState(false);
  const [environmentError, setEnvironmentError] = useState<string | null>(null);
  
  const { isFarcaster, isMobile, isDesktop, environment } = getEnvironmentInfo();

  // Environment-specific initialization requirements
  const getEnvironmentRequirements = () => {
    if (isFarcaster) {
      return {
        requiresManualInit: false, // Auto-init should work in Farcaster
        fallbackMessage: 'XMTP will be set up automatically when you connect your wallet',
        errorMessage: 'XMTP setup failed in Farcaster environment. You can manually initialize later.',
        supportsAutoInit: true
      };
    } else if (isMobile) {
      return {
        requiresManualInit: false, // Auto-init should work on mobile
        fallbackMessage: 'XMTP will be set up automatically when you connect your wallet',
        errorMessage: 'XMTP setup failed on mobile. You can manually initialize later.',
        supportsAutoInit: true
      };
    } else {
      return {
        requiresManualInit: false, // Auto-init should work on desktop
        fallbackMessage: 'XMTP will be set up automatically when you connect your wallet',
        errorMessage: 'XMTP setup failed on desktop. You can manually initialize later.',
        supportsAutoInit: true
      };
    }
  };

  const requirements = getEnvironmentRequirements();

  // Auto-initialization with environment-specific handling
  useEffect(() => {
    const autoInitializeXMTP = async () => {
      if (autoInitAttempted) return;
      
      if (isConnected && address && walletClient && !isRegistered && !isInitializing && !isAutoInitializing && requirements.supportsAutoInit) {
        console.log(`[Environment] Auto-initializing XMTP for ${environment} environment:`, address);
        setIsAutoInitializing(true);
        setAutoInitAttempted(true);
        setEnvironmentError(null);
        
        try {
          const { ethers } = await import('ethers');
          const provider = new ethers.BrowserProvider(walletClient);
          const signer = await provider.getSigner();
          
          await initializeClient(signer);
          console.log(`[Environment] XMTP auto-initialization successful in ${environment}`);
        } catch (error) {
          console.error(`[Environment] XMTP auto-initialization failed in ${environment}:`, error);
          setEnvironmentError(requirements.errorMessage);
        } finally {
          setIsAutoInitializing(false);
        }
      }
    };

    autoInitializeXMTP();
  }, [isConnected, address, walletClient, isRegistered, isInitializing, isAutoInitializing, autoInitAttempted, initializeClient, environment, requirements]);

  // Reset when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setAutoInitAttempted(false);
      setEnvironmentError(null);
    }
  }, [isConnected]);

  return {
    environment,
    isFarcaster,
    isMobile,
    isDesktop,
    isAutoInitializing,
    environmentError,
    requirements,
    autoInitAttempted
  };
}; 