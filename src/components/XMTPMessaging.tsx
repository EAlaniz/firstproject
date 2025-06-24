import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useXMTP } from '../contexts/XMTPContext';
import { 
  MessageCircle, 
  Send, 
  Plus, 
  X, 
  Loader2, 
  CheckCircle, 
  AlertCircle
} from 'lucide-react';
import { detectEnvironment } from '../utils/environment';

interface XMTPMessagingProps {
  isOpen: boolean;
  onClose: () => void;
}

const XMTPMessaging: React.FC<XMTPMessagingProps> = ({ isOpen, onClose }) => {
  const { address } = useAccount();
  const { 
    client, 
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
    clearError 
  } = useXMTP();

  const { isFarcasterMiniApp, platform, detectionMethods } = detectEnvironment();

  // Local state
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      const messagesEndRef = document.getElementById('messages-end');
      if (messagesEndRef) {
        messagesEndRef.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [selectedConversation, messages]);

  // Cleanup subscriptions when component unmounts
  useEffect(() => {
    return () => {
      if (selectedConversation) {
        unsubscribeFromMessages(selectedConversation);
      }
    };
  }, [selectedConversation, unsubscribeFromMessages]);

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
                    <span>Loading...</span>
                  </div>
                )}
                {isRegistered && (
                  <div className="flex items-center space-x-1 text-xs text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    <span>Ready</span>
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
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border-b border-red-200">
              <div className="flex items-start space-x-2 text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-sm font-medium">Error</span>
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
            ) : !isRegistered ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Connect your wallet to start messaging</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No conversations yet</p>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  Start your first chat
                </button>
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
                <div id="messages-end" />
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
  );
};

export default XMTPMessaging; 