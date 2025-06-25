import React, { useState, useEffect, useRef } from 'react';
import { useXMTP } from '../contexts/XMTPContext';
import { Conversation, DecodedMessage } from '@xmtp/browser-sdk';
import { Send, Users, Plus, X, MessageCircle, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAccount } from 'wagmi';

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
  
  const {
    conversations,
    messages,
    isLoading,
    error,
    isRegistered,
    isInitializing,
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
        {/* XMTP Status Indicator */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-md mx-auto">
          {isInitializing && (
            <div className="text-xs text-blue-500 text-center">
              <Loader2 className="w-3 h-3 inline-block animate-spin mr-1" /> Setting up messaging...
            </div>
          )}
          {isRegistered && !isInitializing && (
            <div className="text-xs text-green-600 text-center">
              <CheckCircle className="w-3 h-3 inline-block mr-1" /> Ready to chat on XMTP!
            </div>
          )}
          {!isRegistered && !isInitializing && (
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
                <p className="text-sm mb-2">
                  {isInitializing ? 'Setting up messaging...' : 'Setting up messaging'}
                </p>
                <p className="text-xs text-gray-400">
                  Connect your wallet to enable messaging
                </p>
                {error && (
                  <p className="text-xs text-red-500 mt-2">
                    {error}
                  </p>
                )}
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
              conversations.map((conversation: Conversation) => {
                const conv = conversation as MinimalConversation;
                return (
                  <div
                    key={conv.id || conv.peerAddress}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation && (selectedConversation as MinimalConversation).id === conv.id
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
                          {formatAddress(conv.peerAddress || 'Unknown')}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          New conversation
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
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
                        {formatAddress((selectedConversation as MinimalConversation).peerAddress || 'Unknown')}
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
                {messages.map((message: DecodedMessage, index: number) => {
                  const msg = message as MinimalMessage;
                  const conv = selectedConversation as MinimalConversation;
                  return (
                    <div
                      key={index}
                      className={`flex ${
                        msg.senderAddress === conv.peerAddress
                          ? 'justify-start'
                          : 'justify-end'
                      }`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.senderAddress === conv.peerAddress
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        <p className="text-sm">{String(msg.content)}</p>
                        <p className={`text-xs mt-1 ${
                          msg.senderAddress === conv.peerAddress
                            ? 'text-gray-500'
                            : 'text-blue-200'
                        }`}>
                          {formatTimestamp(msg.sent || new Date())}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="flex items-center p-4 border-t border-gray-200">
                <input
                  type="text"
                  className="flex-1 border rounded px-3 py-2 mr-2"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  disabled={!isRegistered || isInitializing}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!isRegistered || isInitializing || !newMessage.trim()}
                  className={`bg-blue-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 ${(!isRegistered || isInitializing || !newMessage.trim()) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 transition-colors'}`}
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </div>
              {(!isRegistered || isInitializing) && (
                <div className="text-xs text-red-500 text-center w-full pb-2">
                  Connect wallet and complete messaging setup to start chatting.
                </div>
              )}
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