import React, { useState, useEffect, useCallback } from 'react';
import { Client } from '@xmtp/browser-sdk';
import { useSimpleXMTP } from '../contexts/SimpleXMTPContext';
import { useXMTPClient, useXMTPInitialized, useXMTPError } from '../contexts/useXMTPHooks';

export const SimpleXMTPMessaging: React.FC = () => {
  const { isConnecting } = useSimpleXMTP();
  const client = useXMTPClient();
  const isInitialized = useXMTPInitialized();
  const { error } = useXMTPError();

  // Local state for conversations and messages
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [canMessageRecipient, setCanMessageRecipient] = useState<boolean | null>(null);
  const [checkingRecipient, setCheckingRecipient] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Load conversations using official SDK method
  const loadConversations = useCallback(async () => {
    if (!client) return;
    setIsLoadingConversations(true);
    try {
      const convs = await client.conversations.list();
      setConversations(convs);
    } catch (err) {
      // ignore
    } finally {
      setIsLoadingConversations(false);
    }
  }, [client]);

  // Load messages for a conversation using official SDK method
  const loadMessages = useCallback(async (conversation: any) => {
    if (!conversation) return;
    setIsLoadingMessages(true);
    try {
      const msgs = await conversation.messages();
      setMessages(msgs);
    } catch (err) {
      // ignore
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // Check if recipient can receive messages using official SDK method
  const checkRecipientCanMessage = async (recipient: string) => {
    if (!recipient.trim() || !client) {
      setCanMessageRecipient(null);
      return;
    }
    setCheckingRecipient(true);
    try {
      const canMessageMap = await Client.canMessage(
        [{ identifier: recipient.trim(), identifierKind: 'Ethereum' }],
        'production'
      );
      const canMessage = canMessageMap.get(recipient.trim()) ?? false;
      setCanMessageRecipient(canMessage);
    } catch (error) {
      setCanMessageRecipient(false);
    } finally {
      setCheckingRecipient(false);
    }
  };

  // Create new conversation using official SDK method
  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipient.trim() || !client) return;
    if (canMessageRecipient === false) {
      alert('This recipient cannot receive XMTP messages. They may need to create an XMTP account first.');
      return;
    }
    try {
      await (client.conversations as any).newConversation(newRecipient.trim());
      setNewRecipient('');
      setShowNewConversation(false);
      setCanMessageRecipient(null);
      await loadConversations();
    } catch (err) {
      alert('Failed to create conversation. Please try again.');
    }
  };

  // Send message using official SDK method
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || isSending || !selectedConversation) return;
    setIsSending(true);
    try {
      await selectedConversation.send(messageText.trim());
      setMessageText('');
      await loadMessages(selectedConversation);
    } catch (err) {
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Load conversations when client is available
  useEffect(() => {
    if (client && isInitialized) {
      loadConversations();
    }
  }, [client, isInitialized, loadConversations]);

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting Up XMTP...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center mb-2">
            <span className="text-red-500 text-xl mr-2">⚠️</span>
            <h3 className="text-red-800 font-semibold">XMTP Error</h3>
          </div>
          <p className="text-red-700 text-sm mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">XMTP Not Initialized</h3>
          <p className="text-sm text-gray-600 mb-4">Connect your wallet to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white">
      {/* Conversation List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Messages</h2>
            <button
              onClick={() => setShowNewConversation(!showNewConversation)}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              New
            </button>
          </div>
        </div>
        {showNewConversation && (
          <div className="p-4 border-b border-gray-200 bg-blue-50">
            <form onSubmit={handleCreateConversation}>
              <input
                type="text"
                placeholder="Enter wallet address (0x...)"
                value={newRecipient}
                onChange={(e) => {
                  setNewRecipient(e.target.value);
                  if (e.target.value.trim().length > 10) {
                    checkRecipientCanMessage(e.target.value.trim());
                  } else {
                    setCanMessageRecipient(null);
                  }
                }}
                className={`w-full px-3 py-2 border rounded text-sm mb-2 ${
                  canMessageRecipient === false
                    ? 'border-red-300'
                    : canMessageRecipient === true
                    ? 'border-green-300'
                    : 'border-gray-300'
                }`}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!newRecipient.trim() || canMessageRecipient === false || checkingRecipient}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    canMessageRecipient === false
                      ? 'bg-red-400 text-white cursor-not-allowed'
                      : canMessageRecipient === true
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
                  }`}
                >
                  {checkingRecipient
                    ? 'Checking...'
                    : canMessageRecipient === false
                    ? 'Cannot Message'
                    : canMessageRecipient === true
                    ? 'Create Chat'
                    : 'Create'
                  }
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewConversation(false)}
                  className="bg-gray-400 text-white px-3 py-1 rounded text-sm hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
            {canMessageRecipient === false && (
              <div className="text-xs text-red-600 mt-1">
                ⚠️ This address cannot receive XMTP messages.
              </div>
            )}
            {canMessageRecipient === true && (
              <div className="text-xs text-green-600 mt-1">
                ✅ Ready to create conversation!
              </div>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {isLoadingConversations ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No conversations yet</p>
              <button
                onClick={loadConversations}
                className="text-blue-600 text-sm hover:underline mt-2"
              >
                Refresh
              </button>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.topic}
                onClick={() => {
                  setSelectedConversation(conversation);
                  loadMessages(conversation);
                }}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedConversation?.topic === conversation.topic ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conversation.peerAddress ? 'DM' : 'Group Chat'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {conversation.peerAddress || conversation.topic.slice(0, 20)}...
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        {selectedConversation && (
          <>
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-800">
                Direct Message
              </h3>
              <p className="text-xs text-gray-500">{selectedConversation.peerAddress}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoadingMessages ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No messages yet</p>
                  <p className="text-sm">Send a message to start the conversation</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const messageContent = message.content || String(message.content || '');
                  const messageId = message.id || `msg-${index}`;
                  const sentAt = message.sentAt ? new Date(message.sentAt) : new Date();
                  const isOwnMessage = message.senderAddress === (client as any)?.address;
                  return (
                    <div
                      key={messageId}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{messageContent}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwnMessage
                              ? 'text-blue-100'
                              : 'text-gray-500'
                          }`}
                        >
                          {sentAt.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={isSending}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim() || isSending}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSending ? '...' : 'Send'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};