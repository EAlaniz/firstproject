import React, { useState, useEffect } from 'react';
import { useXMTP } from '../contexts/XMTPContext';
import { Conversation, DecodedMessage } from '@xmtp/xmtp-js';
import { Send, Users, Plus, Search, MessageCircle } from 'lucide-react';

interface XMTPMessagingProps {
  isOpen: boolean;
  onClose: () => void;
}

const XMTPMessaging: React.FC<XMTPMessagingProps> = ({ isOpen, onClose }) => {
  const {
    client,
    conversations,
    messages,
    isLoading,
    error,
    sendMessage,
    createConversation,
    loadMessages,
  } = useXMTP();

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation, loadMessages]);

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    await sendMessage(selectedConversation, newMessage.trim());
    setNewMessage('');
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
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl h-[80vh] flex overflow-hidden rounded-2xl">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Messages</h2>
              <button
                onClick={() => setShowNewChat(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* New Chat Modal */}
          {showNewChat && (
            <div className="p-4 border-b border-gray-200">
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter wallet address"
                  value={newContactAddress}
                  onChange={(e) => setNewContactAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleCreateConversation}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Chat
                  </button>
                  <button
                    onClick={() => setShowNewChat(false)}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
              <div className="p-4 text-center text-gray-500">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No conversations yet</p>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="mt-2 text-blue-600 hover:text-blue-700"
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
                      <p className="text-xs opacity-70 mt-1">
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
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