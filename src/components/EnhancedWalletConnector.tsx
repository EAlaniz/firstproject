import React, { useEffect, useState } from 'react'
import { useAccount, useDisconnect, useConnect } from 'wagmi'
import { getWalletClient } from '@wagmi/core'
import type { WalletClient } from 'viem'
import {
  Monitor,
  Smartphone,
  User,
  LogOut,
  Zap
} from 'lucide-react'
import { isFarcasterMiniApp } from '../utils/farcasterCompatibility'
import { wagmiConfig } from '../../wagmi.config'

interface EnhancedWalletConnectorProps {
  className?: string
  children?: React.ReactNode
  onOpenModal?: () => void
  onWalletClientReady?: (client: WalletClient) => void // <-- XMTP support
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
  const [, setWalletClient] = useState<WalletClient | null>(null)

  // Filter connectors: Only show WalletConnect and others if not in Farcaster mini app
  const filteredConnectors = connectors

  // Get the Coinbase Wallet connector (or injected)
  const coinbaseConnector = filteredConnectors.find(connector => 
    connector.id === 'coinbaseWallet' || connector.id === 'io.coinbase.wallet' || connector.id === 'injected'
  );

  // 🔌 Load wallet client for XMTP on connect
  useEffect(() => {
    const loadClient = async () => {
      if (isConnected) {
        try {
          let client: WalletClient | null = null;
          client = await getWalletClient(wagmiConfig);
          setWalletClient(client)
          if (onWalletClientReady && client) onWalletClientReady(client)
        } catch (error) {
          console.error('Failed to get wallet client:', error)
        }
      } else {
        setWalletClient(null)
      }
    }
    loadClient()
  }, [isConnected, address, onWalletClientReady])

  const handleConnect = () => {
    if (coinbaseConnector) {
      try {
        connect({ connector: coinbaseConnector });
      } catch (error) {
        console.error('Connection failed:', error);
      }
    } else {
      console.error('Coinbase Wallet/injected connector not found');
      // Fallback: try to connect with the first available connector
      if (filteredConnectors.length > 0) {
        connect({ connector: filteredConnectors[0] });
      }
    }
  }

  const handleDisconnect = () => {
    disconnect()
  }

  // --- UNIFIED UI FOR ALL ENVIRONMENTS ---

  if (isConnected && address) {
    return (
      <div className={`flex flex-col items-center space-y-1 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-black" />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium">{address.slice(0, 6)}...{address.slice(-4)}</div>
          </div>
          <button onClick={handleDisconnect} className="p-1 hover:bg-gray-100 rounded-full transition-colors" title="Disconnect">
            <LogOut className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
    )
  }

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
    <div className="relative flex flex-col items-center">
      <button 
        onClick={handleConnect}
        disabled={isPending}
        className={`bg-gray-100 text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors flex items-center space-x-2 ${className} ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <User className="w-4 h-4" />
        <span>{isPending ? 'Connecting...' : 'Connect Wallet'}</span>
      </button>
    </div>
  )
}
