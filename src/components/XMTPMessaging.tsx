import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Send, Users, Plus, X, MessageCircle, Loader2, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { initXMTP, getXMTPClient } from '../xmtpClient';
import { useMessageStream } from '../useMessageStream';

// Extend the Window type to include farcaster (if present)
declare global {
  interface Window {
    farcaster?: {
      getProvider?: () => Promise<unknown>;
    };
  }
}

interface XMTPMessagingProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MinimalConversation {
  id?: string;
  peerAddress?: string;
}

interface MinimalMessage {
  senderAddress?: string;
  content?: string;
  sent?: Date;
}

const XMTPMessaging: React.FC<XMTPMessagingProps> = ({ isOpen, onClose }) => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [client, setClient] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newContactAddress, setNewContactAddress] = useState('');
  const [selectedPeer, setSelectedPeer] = useState<string>('');
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Initialize XMTP when wallet connects
  useEffect(() => {
    const initializeXMTP = async () => {
      if (address && walletClient && !client && !isInitializing) {
        setIsInitializing(true);
        setError(null);
        
        try {
          const { ethers } = await import('ethers');
          const provider = new ethers.BrowserProvider(walletClient);
          const signer = await provider.getSigner();
          const xmtpClient = await initXMTP(signer);
          setClient(xmtpClient);
        } catch (err) {
          console.error('Failed to initialize XMTP:', err);
          setError('Failed to initialize XMTP. Please try again.');
        } finally {
          setIsInitializing(false);
        }
      }
    };

    initializeXMTP();
  }, [address, walletClient, client, isInitializing]);

  // Use message stream for selected peer
  const { messages, sendMessage } = useMessageStream(client, selectedPeer);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSendMessage = async () => {
    if (!selectedPeer) return;
    
    const input = document.getElementById('message-input') as HTMLInputElement;
    const content = input?.value?.trim();
    if (!content) return;

    try {
      await sendMessage(content);
      input.value = '';
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    }
  };

  const handleCreateConversation = () => {
    if (!newContactAddress.trim()) return;
    setSelectedPeer(newContactAddress.trim());
    setNewContactAddress('');
    setShowNewChat(false);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div className="bg-white w-full max-w-4xl h-[80vh] flex overflow-hidden rounded-2xl">
        {/* XMTP Status Indicator */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-md mx-auto">
          {isInitializing && (
            <div className="text-xs text-blue-500 text-center">
              <Loader2 className="w-3 h-3 inline-block animate-spin mr-1" /> Setting up messaging...
            </div>
          )}
          {client && !isInitializing && (
            <div className="text-xs text-green-600 text-center">
              <CheckCircle className="w-3 h-3 inline-block mr-1" /> Ready to chat on XMTP!
            </div>
          )}
          {!client && !isInitializing && (
            <div className="text-xs text-gray-500 text-center">
              Messaging unavailable. Connect wallet and complete setup.
            </div>
          )}
          {error && (
            <div className="text-xs text-red-500 text-center">{error}</div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Messages</h2>
              <div className="flex items-center space-x-2">
                {isInitializing && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Initializing...</span>
                  </div>
                )}
                {client && (
                  <div className="flex items-center space-x-1 text-xs text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    <span>Connected</span>
                  </div>
                )}
                <button
                  onClick={() => setShowNewChat(true)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  disabled={!client}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* New Chat Modal */}
          {showNewChat && (
            <div className="p-4 border-b border-gray-200">
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter wallet address (0x...)"
                  value={newContactAddress}
                  onChange={(e) => setNewContactAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleCreateConversation}
                    disabled={!newContactAddress.trim()}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Start Chat
                  </button>
                  <button
                    onClick={() => setShowNewChat(false)}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {!address ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Please connect your wallet first</p>
              </div>
            ) : !client ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm mb-2">
                  {isInitializing ? 'Setting up messaging...' : 'Setting up messaging'}
                </p>
                <p className="text-xs text-gray-400">
                  Connect your wallet to enable messaging
                </p>
              </div>
            ) : !selectedPeer ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No conversation selected</p>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  Start your first chat
                </button>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {formatAddress(selectedPeer)}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      Active conversation
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedPeer ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {formatAddress(selectedPeer)}
                      </p>
                      <p className="text-xs text-gray-500">Active now</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      (message as any).senderAddress === selectedPeer
                        ? 'justify-start'
                        : 'justify-end'
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        (message as any).senderAddress === selectedPeer
                          ? 'bg-gray-100 text-gray-900'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      <p className="text-sm">{String((message as any).content)}</p>
                      <p className={`text-xs mt-1 ${
                        (message as any).senderAddress === selectedPeer
                          ? 'text-gray-500'
                          : 'text-blue-200'
                      }`}>
                        {formatTimestamp((message as any).sent || new Date())}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="flex items-center p-4 border-t border-gray-200">
                <input
                  id="message-input"
                  type="text"
                  className="flex-1 border rounded px-3 py-2 mr-2"
                  placeholder="Type your message..."
                  disabled={!client || isInitializing}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!client || isInitializing}
                  className={`bg-blue-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 ${(!client || isInitializing) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 transition-colors'}`}
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm">Choose a contact to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default XMTPMessaging; 