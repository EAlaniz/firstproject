import React, { useEffect, useState } from 'react'
import { useAccount, useDisconnect, useConnect } from 'wagmi'
import { getWalletClient } from '@wagmi/core'
import { base } from 'wagmi/chains'
import { createWalletClient, http } from 'viem'
import {
  Monitor,
  Smartphone,
  User,
  LogOut,
  Zap
} from 'lucide-react'

// 🌐 Environment detection
export const getEnvironmentInfo = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)

  const isFarcaster =
    window.location.hostname.includes('warpcast.com') ||
    window.location.hostname.includes('farcaster.xyz') ||
    window.location.hostname.includes('farcaster.com') ||
    (typeof window !== 'undefined' && 'farcaster' in window && window.farcaster !== undefined)

  const isDesktop = !isMobile && !isFarcaster
  const environment = isFarcaster ? 'farcaster' : isMobile ? 'mobile' : 'desktop'

  return { isFarcaster, isMobile, isDesktop, environment }
}

export const isFarcasterMiniApp = () => getEnvironmentInfo().isFarcaster

interface EnhancedWalletConnectorProps {
  className?: string
  children?: React.ReactNode
  onOpenModal?: () => void
  onWalletClientReady?: (client: any) => void // <-- XMTP support
}

export const EnhancedWalletConnector: React.FC<EnhancedWalletConnectorProps> = ({
  className = '',
  children = null,
  onOpenModal,
  onWalletClientReady
}) => {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { connect, connectors, isPending } = useConnect()
  const { isFarcaster, isMobile } = getEnvironmentInfo()
  const [walletClient, setWalletClient] = useState<any>(null)

  // Get the Coinbase Wallet connector
  console.log('Available connectors:', connectors.map(c => ({ id: c.id, name: c.name })));
  console.log('Full connector details:', connectors.map(c => ({
    id: c.id,
    name: c.name,
    type: c.type,
    ready: c.ready
  })));
  const coinbaseConnector = connectors.find(connector => 
    connector.id === 'coinbaseWallet' || connector.id === 'io.coinbase.wallet' || connector.id.includes('coinbase')
  );
  console.log('Coinbase connector found:', !!coinbaseConnector);
  if (coinbaseConnector) {
    console.log('Coinbase connector details:', {
      id: coinbaseConnector.id,
      name: coinbaseConnector.name,
      type: coinbaseConnector.type,
      ready: coinbaseConnector.ready
    });
  }

  // 🔌 Load wallet client for XMTP on connect
  useEffect(() => {
    const loadClient = async () => {
      if (isConnected) {
        try {
          // Use explicit RPC URL to avoid the "No rpcUrl provided" warning
          const rpcUrl = import.meta.env.VITE_RPC_URL || 'https://flashy-convincing-paper.base-mainnet.quiknode.pro/fe55bc09278a1ccc534942fad989695b412ab4ea/'
          
          console.log('🔧 EnhancedWalletConnector creating wallet client with RPC URL:', rpcUrl);
          
          const client = await getWalletClient()
          
          console.log('✅ Wallet client created successfully:', {
            address: client?.account?.address,
            chainId: client?.chain?.id,
            transport: client?.transport?.type
          });
          
          setWalletClient(client)
          if (onWalletClientReady) onWalletClientReady(client)
        } catch (error) {
          console.error('Failed to get wallet client:', error)
        }
      } else {
        setWalletClient(null)
      }
    }
    loadClient()
  }, [isConnected, address])

  const handleConnect = () => {
    if (coinbaseConnector) {
      try {
        connect({ connector: coinbaseConnector });
      } catch (error) {
        console.error('Connection failed:', error);
      }
    } else {
      console.error('Coinbase Wallet connector not found');
      // Fallback: try to connect with the first available connector
      if (connectors.length > 0) {
        connect({ connector: connectors[0] });
      }
    }
  }

  const handleDisconnect = () => {
    disconnect()
  }

  // ✅ Farcaster Mini App view
  if (isFarcaster) {
    return isConnected && address ? (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
          <Zap className="w-4 h-4 text-purple-600" />
        </div>
        <div className="hidden sm:block">
          <div className="text-sm font-medium">{address.slice(0, 6)}...{address.slice(-4)}</div>
          <div className="text-xs text-purple-600">Connected to Farcaster</div>
        </div>
        <button onClick={handleDisconnect} className="p-1 hover:bg-gray-100 rounded-full transition-colors" title="Disconnect">
          <LogOut className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    ) : (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
          <Zap className="w-4 h-4 text-gray-400" />
        </div>
        <div className="hidden sm:block">
          <div className="text-sm font-medium">Not Connected</div>
          <div className="text-xs text-gray-500">Farcaster Mini App</div>
        </div>
      </div>
    )
  }

  // 📱 Mobile Wallet Connection
  if (isMobile) {
    return isConnected && address ? (
      <div className={`flex flex-col items-center space-y-1 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-blue-600" />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium">{address.slice(0, 6)}...{address.slice(-4)}</div>
          </div>
          <button onClick={handleDisconnect} className="p-1 hover:bg-gray-100 rounded-full transition-colors" title="Disconnect">
            <LogOut className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
    ) : (
      <div className="relative flex flex-col items-center">
        <button 
          onClick={handleConnect}
          disabled={isPending}
          className={`bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors flex items-center space-x-2 ${className} ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Smartphone className="w-4 h-4" />
          <span>{isPending ? 'Connecting...' : 'Connect Wallet'}</span>
        </button>
        <div className="text-xs text-gray-500 mt-2 text-center">
          You'll be redirected to the Coinbase Wallet app to connect securely.
        </div>
      </div>
    )
  }

  // 🖥️ Desktop UI
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
      </div>
    )
  }

  return (
    <div className="relative">
      {children || (
        <button 
          onClick={handleConnect}
          disabled={isPending}
          className={`bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors flex items-center space-x-2 ${className} ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Monitor className="w-4 h-4" />
          <span>{isPending ? 'Connecting...' : 'Connect Wallet'}</span>
        </button>
      )}
    </div>
  )
}
