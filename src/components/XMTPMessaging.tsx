import React, { useState, useEffect, useRef } from 'react';
import { useXMTP } from '../contexts/XMTPContext';
import { Conversation, DecodedMessage } from '@xmtp/xmtp-js';
import { Send, Users, Plus, X, MessageCircle, Loader2, AlertCircle, CheckCircle, Lock, Info } from 'lucide-react';
import { useAccount, useWalletClient } from 'wagmi';
import { detectEnvironment } from '../utils/environment';

// Extend the Window type to include farcaster (if present)
declare global {
  interface Window {
    farcaster?: {
      getProvider?: () => Promise<any>;
    };
  }
}

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
  } = useXMTP() as any;
  const setError = (window as any).setError || ((msg: string) => { if (typeof clearError === 'function') clearError(); }); // fallback

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Detect environment once
  const { isFarcasterMiniApp, platform, detectionMethods } = detectEnvironment();

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

  // Initialize XMTP once when component mounts and wallet is available
  useEffect(() => {
    if (isOpen && address && walletClient && !isRegistered && !isInitializing) {
      console.log('[XMTP] Auto-initializing XMTP for address:', address);
      console.log('[XMTP] Environment:', { isFarcasterMiniApp, platform, detectionMethods });
      handleInitializeXMTP();
    }
  }, [isOpen, address, walletClient, isRegistered, isInitializing]);

  const handleInitializeXMTP = async () => {
    console.log('[XMTP] handleInitializeXMTP called');
    console.log('[XMTP] address:', address);
    console.log('[XMTP] Environment:', { isFarcasterMiniApp, platform, detectionMethods });
    console.log('[XMTP] walletClient:', walletClient);

    if (!address || !walletClient) {
      const errMsg = 'Wallet not connected. Please connect your wallet first.';
      console.error('[XMTP]', errMsg);
      setError(errMsg);
      return;
    }

    try {
      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();
      
      console.log('[XMTP] Signer created, initializing XMTP client...');
      console.log('[XMTP] Platform:', platform);
      
      // In mini app, skip the signature test and go directly to XMTP initialization
      if (isFarcasterMiniApp) {
        console.log('[XMTP] Mini app mode: skipping signature test');
        await initializeClient(signer);
      } else {
        // Web context: test signature capability first
        console.log('[XMTP] Web mode: testing signature capability');
        try {
          await signer.signMessage('XMTP test');
          console.log('[XMTP] Signature test successful');
          await initializeClient(signer);
        } catch (err: any) {
          console.error('[XMTP] Wallet does not support required signature method:', err);
          
          // Handle user rejection specifically
          if (err.code === 4001 || err.message.includes('user rejected') || err.message.includes('ACTION_REJECTED')) {
            setError('Please approve the signature request to enable secure messaging with XMTP.');
            return;
          } else {
            setError('Your wallet does not support the required signature method for XMTP. Please use MetaMask or Coinbase Wallet.');
          }
          return;
        }
      }
    } catch (err: any) {
      console.error('[XMTP] Failed to initialize XMTP:', err);
      
      // Handle user rejection specifically
      if (err.code === 4001 || err.message.includes('user rejected') || err.message.includes('ACTION_REJECTED')) {
        setError('Please approve the signature request to enable secure messaging with XMTP.');
        return;
      } else {
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Failed to initialize XMTP. Please try again.';
        setError(`XMTP Initialization Failed: ${errorMessage}`);
      }
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

  // Signature prompt modal
  const SignaturePromptModal = () => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Enable Secure Messaging</h3>
            <p className="text-gray-600 mb-6">
              {error || 'To use XMTP messaging, you need to sign a message to verify your identity. This is a one-time setup.'}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => onClose()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInitializeXMTP}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <SignaturePromptModal />
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

              {/* Environment Info */}
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2 text-blue-700">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm font-medium">Environment: {platform}</span>
                    <p className="text-xs mt-1">Detected via: {detectionMethods.join(', ')}</p>
                  </div>
                </div>
              </div>
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
                      Create Chat
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
                  <span className="text-sm">Loading conversations...</span>
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No conversations yet</p>
                  {!isRegistered && (
                    <button
                      onClick={handleInitializeXMTP}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Initialize XMTP
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.peerAddress}
                      onClick={() => {
                        setSelectedConversation(conversation);
                        loadMessages(conversation);
                        subscribeToMessages(conversation);
                      }}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedConversation?.peerAddress === conversation.peerAddress ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {conversation.peerAddress.slice(2, 4).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {formatAddress(conversation.peerAddress)}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {conversation.peerAddress}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">
                        {selectedConversation.peerAddress.slice(2, 4).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">
                        {formatAddress(selectedConversation.peerAddress)}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {selectedConversation.peerAddress}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderAddress === address ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderAddress === address
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {formatTimestamp(message.sent)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm">Choose a conversation from the sidebar to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default XMTPMessaging; 