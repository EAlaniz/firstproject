import React, { useState, useEffect } from 'react';
import { useSimpleXMTP } from '../contexts/SimpleXMTPContext';

export const SimpleXMTPMessaging: React.FC = () => {
  const {
    client,
    isInitialized,
    isLoading,
    error,
    conversations,
    selectedConversation,
    messages,
    initialize,
    selectConversation,
    createConversation,
    refreshConversations,
    canMessageIdentities,
    sendOptimisticMessage,
  } = useSimpleXMTP();

  const [newRecipient, setNewRecipient] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [canMessageRecipient, setCanMessageRecipient] = useState<boolean | null>(null);
  const [checkingRecipient, setCheckingRecipient] = useState(false);

  // Auto-initialize when component mounts
  useEffect(() => {
    if (!isInitialized && !isLoading) {
      initialize();
    }
  }, [isInitialized, isLoading, initialize]);

  // Handle message sending with optimistic UX
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || isSending) return;

    setIsSending(true);
    try {
      // Use optimistic message sending for better UX
      await sendOptimisticMessage(messageText.trim());
      setMessageText('');
    } catch (err) {
      console.error('Failed to send message:', err);
      // Could implement retry logic here
    } finally {
      setIsSending(false);
    }
  };

  // Check if recipient can receive messages
  const checkRecipientCanMessage = async (recipient: string) => {
    if (!recipient.trim()) {
      setCanMessageRecipient(null);
      return;
    }
    
    setCheckingRecipient(true);
    try {
      const result = await canMessageIdentities([recipient.trim()]);
      const canMessage = result.get(recipient.trim()) || false;
      setCanMessageRecipient(canMessage);
    } catch (error) {
      console.error('Failed to check if recipient can receive messages:', error);
      setCanMessageRecipient(false);
    } finally {
      setCheckingRecipient(false);
    }
  };
  
  // Handle creating new conversation with validation
  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipient.trim()) return;
    
    // Final check before creating conversation
    if (canMessageRecipient === false) {
      alert('This recipient cannot receive XMTP messages. They may need to create an XMTP account first.');
      return;
    }

    try {
      await createConversation(newRecipient.trim());
      setNewRecipient('');
      setShowNewConversation(false);
      setCanMessageRecipient(null);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting Up XMTP...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center mb-2">
            <span className="text-red-500 text-xl mr-2">⚠️</span>
            <h3 className="text-red-800 font-semibold">XMTP Error</h3>
          </div>
          <p className="text-red-700 text-sm mb-4">{error}</p>
          <button
            onClick={initialize}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Not initialized
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">XMTP Not Initialized</h3>
          <button
            onClick={initialize}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Initialize XMTP
          </button>
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

        {/* New Conversation Form */}
        {showNewConversation && (
          <div className="p-4 border-b border-gray-200 bg-blue-50">
            <form onSubmit={handleCreateConversation}>
              <input
                type="text"
                placeholder="Enter wallet address (0x...)"
                value={newRecipient}
                onChange={(e) => {
                  setNewRecipient(e.target.value);
                  // Check recipient capability when typing
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

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No conversations yet</p>
              <button
                onClick={refreshConversations}
                className="text-blue-600 text-sm hover:underline mt-2"
              >
                Refresh
              </button>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => selectConversation(conversation)}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {'members' in conversation ? 'Group Chat' : 'DM'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {conversation.id.slice(0, 20)}...
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {messages[conversation.id] && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                        {messages[conversation.id].length}
                      </span>
                    )}
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
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-800">
                {'members' in selectedConversation ? 'Group Chat' : 'Direct Message'}
              </h3>
              <p className="text-xs text-gray-500">{selectedConversation.id}</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages[selectedConversation.id]?.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No messages yet</p>
                  <p className="text-sm">Send a message to start the conversation</p>
                </div>
              ) : (
                messages[selectedConversation.id]?.map((message, index) => {
                  // Ensure content is properly handled to avoid React render errors
                  const messageContent = message.fallback || String(message.content || '');
                  const messageId = message.id || `msg-${index}`;
                  const sentAt = message.sentAt ? new Date(message.sentAt) : new Date();
                  
                  return (
                    <div
                      key={messageId}
                      className={`flex ${
                        message.senderInboxId === client?.inboxId ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                          message.senderInboxId === client?.inboxId
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{messageContent}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.senderInboxId === client?.inboxId
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

            {/* Message Input */}
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
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p className="text-sm">Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};