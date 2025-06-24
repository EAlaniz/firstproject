import React, { useState, useEffect, useRef } from 'react';
import { useXMTP } from '../contexts/XMTPContext';
import { Conversation, DecodedMessage } from '@xmtp/xmtp-js';
import { Send, Users, Plus, X, MessageCircle, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAccount, useWalletClient } from 'wagmi';
import isFarcasterMiniApp from './MiniAppWalletConnector'; // Use default import

interface XMTPMessagingProps {
  isOpen: boolean;
  onClose: () => void;
}

const XMTPMessaging: React.FC<XMTPMessagingProps> = ({ isOpen, onClose }) => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const {
    client,
    conversations,
    messages,
    isLoading,
    error,
    isRegistered,
    isInitializing,
    initializeClient,
    sendMessage,
    createConversation,
    loadMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
    clearError,
  } = useXMTP();

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      subscribeToMessages(selectedConversation);
      
      // Unsubscribe when conversation changes
      return () => {
        unsubscribeFromMessages(selectedConversation);
      };
    }
  }, [selectedConversation, loadMessages, subscribeToMessages, unsubscribeFromMessages]);

  // Show success message when XMTP is initialized
  useEffect(() => {
    if (isRegistered && !isInitializing) {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  }, [isRegistered, isInitializing]);

  const handleInitializeXMTP = async () => {
    if (!walletClient) {
      console.error('No wallet client available');
      alert('Please connect your wallet first before initializing XMTP.');
      return;
    }

    // Detect mini app environment
    if (isFarcasterMiniApp()) {
      console.log('Farcaster mini app detected, assuming Coinbase Wallet.');
      // Proceed without connector check
    } else {
      // Enhanced wallet compatibility check for web
      const connectorId = (walletClient as any)?.connector?.id || (walletClient as any)?.id;
      console.log('Wallet connector ID:', connectorId);

      if (connectorId !== 'metaMask' && connectorId !== 'coinbaseWallet') {
        const message = `Please use MetaMask or Coinbase Wallet for XMTP messaging. 
        
Current wallet: ${connectorId || 'Unknown'}
Supported wallets: MetaMask, Coinbase Wallet

XMTP requires EIP-191 signature support which is only available in these wallets.`;
        alert(message);
        return;
      }
      console.log('Initializing XMTP with compatible wallet:', connectorId);
    }

    try {
      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();

      console.log('Signer created successfully, initializing XMTP client...');
      await initializeClient(signer);
    } catch (err) {
      console.error('Failed to initialize XMTP:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to initialize XMTP. Please try again.';
      alert(`XMTP Initialization Failed: ${errorMessage}`);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(selectedConversation, newMessage.trim());
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateConversation = async () => {
    if (!newContactAddress.trim()) return;

    const conversation = await createConversation(newContactAddress.trim());
    if (conversation) {
      setSelectedConversation(conversation);
      setNewContactAddress('');
      setShowNewChat(false);
    }
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
                {isRegistered && (
                  <div className="flex items-center space-x-1 text-xs text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    <span>Connected</span>
                  </div>
                )}
                <button
                  onClick={() => setShowNewChat(true)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  disabled={!isRegistered}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Success Message */}
            {showSuccessMessage && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">XMTP initialized successfully! You can now send and receive messages.</span>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border-b border-red-200">
              <div className="flex items-start space-x-2 text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-sm font-medium">XMTP Error</span>
                  <p className="text-xs mt-1">{error}</p>
                </div>
                <button onClick={clearError} className="flex-shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

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
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-sm">Loading conversations...</p>
              </div>
            ) : !address ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Please connect your wallet first</p>
              </div>
            ) : !isRegistered ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm mb-2">Initialize XMTP to start messaging</p>
                <p className="text-xs text-gray-400 mb-3">
                  Requires MetaMask or Coinbase Wallet for secure messaging
                </p>
                <button
                  onClick={handleInitializeXMTP}
                  disabled={isInitializing}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isInitializing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Initializing XMTP...</span>
                    </div>
                  ) : (
                    'Initialize XMTP'
                  )}
                </button>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No conversations yet</p>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  Start your first chat
                </button>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.peerAddress}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation?.peerAddress === conversation.peerAddress
                      ? 'bg-blue-50 border-blue-200'
                      : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {formatAddress(conversation.peerAddress)}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {conversation.context?.conversationId || 'New conversation'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {formatAddress(selectedConversation.peerAddress)}
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
                      message.senderAddress === selectedConversation.peerAddress
                        ? 'justify-start'
                        : 'justify-end'
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.senderAddress === selectedConversation.peerAddress
                          ? 'bg-gray-100 text-gray-900'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.senderAddress === selectedConversation.peerAddress
                          ? 'text-gray-500'
                          : 'text-blue-200'
                      }`}>
                        {formatTimestamp(message.sent)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSending}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default XMTPMessaging; 