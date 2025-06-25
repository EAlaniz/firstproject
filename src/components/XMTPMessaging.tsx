import React, { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Send, Users, Plus, X, MessageCircle, Loader2, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { useXMTP } from '../contexts/XMTPContext';

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
    clearError,
  } = useXMTP();

  const [newContactAddress, setNewContactAddress] = useState('');
  const [selectedPeer, setSelectedPeer] = useState<string>('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load messages for selected peer
  useEffect(() => {
    if (client && selectedPeer) {
      const load = async () => {
        const convo = await createConversation(selectedPeer);
        if (convo) await loadMessages(convo);
      };
      load();
    }
  }, [client, selectedPeer, createConversation, loadMessages]);

  useEffect(() => {
    if (client) {
      console.log('XMTP Client:', client);
      console.log('Conversations:', conversations);
      console.log('Messages:', messages);
    }
  }, [client, conversations, messages]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSendMessage = async () => {
    if (!selectedPeer || !message.trim()) return;
    const convo = await createConversation(selectedPeer);
    if (!convo) return;
    try {
      await sendMessage(convo, message.trim());
      setMessage('');
    } catch (err) {
      // Error is handled in context
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
      <div className="bg-white w-full max-w-4xl h-[80vh] flex overflow-hidden rounded-2xl relative">
        {/* XMTP Status Indicator */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-md mx-auto">
          {isRegistered && client && !isInitializing && (
            <div className="text-xs text-green-600 text-center">
              <CheckCircle className="w-3 h-3 inline-block mr-1" /> Ready to chat on XMTP!
            </div>
          )}
          {isInitializing && (
            <div className="text-xs text-gray-500 text-center">
              <Loader2 className="w-3 h-3 inline-block mr-1 animate-spin" /> Setting up messaging...
            </div>
          )}
          {error && (
            <div className="text-xs text-red-500 text-center flex items-center justify-center">
              <AlertCircle className="w-3 h-3 inline-block mr-1" /> {error}
              <button onClick={clearError} className="ml-2 text-xs text-blue-600 underline">Clear</button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Messages</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowNewChat(true)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  disabled={!isRegistered || !client}
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
            ) : !isRegistered || !client ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm mb-2">
                  Setting up messaging
                </p>
                <p className="text-xs text-gray-400">
                  Connect your wallet to enable messaging
                </p>
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
              <div>
                {conversations.map((convo, idx) => {
                  const peer = (convo as any).peerAddress || (convo as any).context?.groupId || `convo-${idx}`;
                  return (
                    <button
                      key={peer}
                      onClick={() => setSelectedPeer((convo as any).peerAddress || '')}
                      className={`w-full flex items-center space-x-3 p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${selectedPeer === (convo as any).peerAddress ? 'bg-blue-50' : ''}`}
                    >
                      <Users className="w-5 h-5 text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {formatAddress((convo as any).peerAddress || (convo as any).context?.groupId || 'Unknown')}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          Conversation
                        </p>
                      </div>
                    </button>
                  );
                })}
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
                {messages.map((msg, index) => {
                  const sender = (msg as any).sender || (msg as any).senderAddress || 'unknown';
                  const sent = (msg as any).sent || new Date();
                  return (
                    <div
                      key={sent?.toString() + sender + index}
                      className={`flex ${sender === selectedPeer ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${sender === selectedPeer ? 'bg-gray-100 text-gray-900' : 'bg-blue-600 text-white'}`}
                      >
                        <p className="text-sm">{String((msg as any).content) || 'Missing content'}</p>
                        <p className={`text-xs mt-1 ${sender === selectedPeer ? 'text-gray-500' : 'text-blue-200'}`}>
                          {formatTimestamp(sent)}
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
                  id="message-input"
                  type="text"
                  className="flex-1 border rounded px-3 py-2 mr-2"
                  placeholder="Type your message..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  disabled={!isRegistered || !client}
                  onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!isRegistered || !client}
                  className={`bg-blue-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 ${(!isRegistered || !client) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 transition-colors'}`}
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