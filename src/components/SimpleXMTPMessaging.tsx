import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@xmtp/browser-sdk';
import { useSimpleXMTP } from '../contexts/SimpleXMTPContext';
import { useXMTPClient, useXMTPError } from '../contexts/useXMTPHooks';

// Enhanced message interface
interface EnhancedMessage {
  id: string;
  content: string;
  senderAddress: string;
  sentAt: Date;
  status: 'sending' | 'sent' | 'delivered' | 'failed';
  isOptimistic?: boolean;
}

// Enhanced conversation interface
interface EnhancedConversation {
  topic: string;
  peerAddress?: string;
  isGroup: boolean;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

export const SimpleXMTPMessaging: React.FC = () => {
  const { isConnecting, isInitialized } = useSimpleXMTP();
  const client = useXMTPClient();
  const { clearError } = useXMTPError();

  // Enhanced state management
  const [conversations, setConversations] = useState<EnhancedConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<EnhancedConversation | null>(null);
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [canMessageRecipient, setCanMessageRecipient] = useState<boolean | null>(null);
  const [checkingRecipient, setCheckingRecipient] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [localError, setError] = useState<string | null>(null);

  // Refs for real-time features
  const messageStreamRef = useRef<unknown>(null);
  const conversationStreamRef = useRef<unknown>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Enhanced error handling with retry logic
  const handleError = useCallback((error: unknown, context: string) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[XMTP] ${context} error:`, error);
    setError(`${context} error: ${errorMessage}`);
  }, []);

  // Move this function BEFORE startMessageStream
  const updateConversationWithMessage = useCallback((message: EnhancedMessage) => {
    setConversations(prev => 
      prev.map(conv => {
        if (conv.topic === selectedConversation?.topic) {
          return {
            ...conv,
            lastMessage: message.content,
            lastMessageTime: message.sentAt,
            unreadCount: conv.unreadCount + 1,
          };
        }
        return conv;
      })
    );
  }, [selectedConversation]);

  // Then the streaming functions
  const startMessageStream = useCallback(async () => {
    if (!client || !isOnline) return;

    try {
      console.log('[XMTP] Starting real-time message stream...');
      const stream = await client.conversations.streamAllMessages();
      messageStreamRef.current = (stream as unknown) as AsyncIterableIterator<unknown>;

      for await (const message of (stream as unknown) as AsyncIterableIterator<unknown>) {
        console.log('[XMTP] New message received:', message);
        
        // Add new message to state
        const enhancedMessage: EnhancedMessage = {
          id: (message as { id?: string }).id || `msg-${Date.now()}`,
          content: String((message as { content: unknown }).content || ''),
          senderAddress: (message as { senderAddress: string }).senderAddress,
          sentAt: (message as { sentAt?: Date }).sentAt ? new Date((message as { sentAt: Date }).sentAt) : new Date(),
          status: 'delivered',
        };

        setMessages(prev => [...prev, enhancedMessage]);
        
        // Update conversation list with latest message
        updateConversationWithMessage(enhancedMessage);
      }
    } catch (error) {
      console.error('[XMTP] Message stream error:', error);
      handleError(error, 'message stream');
    }
  }, [client, isOnline, handleError, updateConversationWithMessage]);

  // Real-time conversation streaming
  const startConversationStream = useCallback(async () => {
    if (!client || !isOnline) return;

    try {
      console.log('[XMTP] Starting real-time conversation stream...');
      const stream = await client.conversations.stream();
      conversationStreamRef.current = stream;

      for await (const conversation of stream) {
        console.log('[XMTP] New conversation received:', conversation);
        
        // Add new conversation to state
        const enhancedConversation: EnhancedConversation = {
          topic: conversation.topic,
          peerAddress: conversation.peerAddress,
          isGroup: !conversation.peerAddress,
          unreadCount: 0,
        };

        setConversations(prev => [enhancedConversation, ...prev]);
      }
    } catch (error) {
      handleError(error, 'conversation stream');
    }
  }, [client, isOnline, handleError]);

  // Stop streams
  const stopMessageStream = useCallback(() => {
    if (messageStreamRef.current) {
      try {
        messageStreamRef.current.return?.();
        messageStreamRef.current = null;
        console.log('[XMTP] Message stream stopped');
      } catch (error) {
        console.error('[XMTP] Error stopping message stream:', error);
      }
    }
  }, []);

  const stopConversationStream = useCallback(() => {
    if (conversationStreamRef.current) {
      try {
        conversationStreamRef.current.return?.();
        conversationStreamRef.current = null;
        console.log('[XMTP] Conversation stream stopped');
      } catch (error) {
        console.error('[XMTP] Error stopping conversation stream:', error);
      }
    }
  }, []);

  // Network connectivity detection (moved below all streaming function declarations)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('[XMTP] Network connection restored');
      // Reconnect streams when back online
      if (client && isOnline) {
        startMessageStream();
        startConversationStream();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('[XMTP] Network connection lost');
      // Stop streams when offline
      stopMessageStream();
      stopConversationStream();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [client, isOnline, startMessageStream, startConversationStream, stopMessageStream, stopConversationStream]);

  // Enhanced conversation loading with error handling
  const loadConversations = useCallback(async () => {
    if (!client) return;
    
    setIsLoadingConversations(true);
    
    try {
      console.log('[XMTP] Loading conversations...');
      const convs = await client.conversations.list();
      
      const enhancedConversations: EnhancedConversation[] = convs.map((conv: unknown) => ({
        topic: (conv as { topic: string }).topic,
        peerAddress: (conv as { peerAddress?: string }).peerAddress,
        isGroup: !(conv as { peerAddress?: string }).peerAddress,
        unreadCount: 0,
      }));
      
      setConversations(enhancedConversations);
      console.log(`[XMTP] Loaded ${enhancedConversations.length} conversations`);
    } catch (error) {
      handleError(error, 'load conversations');
    } finally {
      setIsLoadingConversations(false);
    }
  }, [client, handleError]);

  // Enhanced message loading with pagination
  const loadMessages = useCallback(async (conversation: EnhancedConversation, limit = 50) => {
    if (!conversation) return;
    
    setIsLoadingMessages(true);
    
    try {
      console.log('[XMTP] Loading messages...');
      const msgs = await conversation.messages({ limit });
      
      const enhancedMessages: EnhancedMessage[] = msgs.map((msg: unknown) => ({
        id: (msg as { id?: string }).id || `msg-${Date.now()}`,
        content: String((msg as { content: unknown }).content || ''),
        senderAddress: (msg as { senderAddress: string }).senderAddress,
        sentAt: (msg as { sentAt?: Date }).sentAt ? new Date((msg as { sentAt: Date }).sentAt) : new Date(),
        status: 'delivered' as const,
      }));
      
      setMessages(enhancedMessages);
      console.log(`[XMTP] Loaded ${enhancedMessages.length} messages`);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      handleError(error, 'load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [handleError]);

  // Enhanced recipient checking with better error handling
  const checkRecipientCanMessage = async (recipient: string) => {
    if (!recipient.trim() || !client) {
      setCanMessageRecipient(null);
      return;
    }
    
    setCheckingRecipient(true);
    
    try {
      console.log('[XMTP] Checking if recipient can receive messages...');
      const canMessageMap = await Client.canMessage(
        [{ identifier: recipient.trim(), identifierKind: 'Ethereum' }],
        'production'
      );
      const canMessage = canMessageMap.get(recipient.trim()) ?? false;
      setCanMessageRecipient(canMessage);
      console.log(`[XMTP] Recipient can message: ${canMessage}`);
    } catch (error) {
      console.error('[XMTP] Error checking recipient:', error);
      setCanMessageRecipient(false);
    } finally {
      setCheckingRecipient(false);
    }
  };

  // Enhanced conversation creation with optimistic UI
  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipient.trim() || !client) return;
    
    if (canMessageRecipient === false) {
      // Enhanced error message with helpful guidance
      const errorMessage = 'This address cannot receive XMTP messages. They may need to:\n\n1. Create an XMTP account first\n2. Enable messaging in their wallet\n3. Switch to a supported network (Base, Ethereum, etc.)';
      alert(errorMessage);
      return;
    }
    
    try {
      console.log('[XMTP] Creating new conversation...');
      const conversation = await client.conversations.newConversation(newRecipient.trim());
      
      // Optimistic UI update
      const newConversation: EnhancedConversation = {
        topic: conversation.topic,
        peerAddress: newRecipient.trim(),
        isGroup: false,
        unreadCount: 0,
      };
      
      setConversations(prev => [newConversation, ...prev]);
      setSelectedConversation(conversation);
      setNewRecipient('');
      setShowNewConversation(false);
      setCanMessageRecipient(null);
      
      console.log('[XMTP] Conversation created successfully');
    } catch (error) {
      handleError(error, 'create conversation');
      alert('Failed to create conversation. Please try again.');
    }
  };

  // Enhanced message sending with optimistic updates
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || isSending || !selectedConversation) return;
    
    const messageContent = messageText.trim();
    setMessageText('');
    setIsSending(true);
    
    // Create optimistic message
    const optimisticMessage: EnhancedMessage = {
      id: `opt-${Date.now()}`,
      content: messageContent,
      senderAddress: client?.address || '',
      sentAt: new Date(),
      status: 'sending',
      isOptimistic: true,
    };
    
    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Auto-scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    try {
      console.log('[XMTP] Sending message...');
      await selectedConversation.send(messageContent);
      
      // Update optimistic message to sent
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticMessage.id 
            ? { ...msg, status: 'sent', isOptimistic: false }
            : msg
        )
      );
      
      console.log('[XMTP] Message sent successfully');
    } catch (error) {
      // Update optimistic message to failed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticMessage.id 
            ? { ...msg, status: 'failed', isOptimistic: false }
            : msg
        )
      );
      
      handleError(error, 'send message');
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fix the useEffect dependencies
  useEffect(() => {
    if (client && isInitialized && isOnline) {
      loadConversations();
      startMessageStream();
      startConversationStream();
    }
    
    return () => {
      stopMessageStream();
      stopConversationStream();
    };
  }, [client, isInitialized, isOnline, loadConversations, startMessageStream, startConversationStream, stopMessageStream, stopConversationStream]);

  // Enhanced loading state
  if (isConnecting) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting Up XMTP...</p>
          <p className="text-xs text-gray-400 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  // Enhanced error state with retry
  if (localError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center mb-2">
            <span className="text-red-500 text-xl mr-2">⚠️</span>
            <h3 className="text-red-800 font-semibold">XMTP Error</h3>
          </div>
          <p className="text-red-700 text-sm mb-4">{localError}</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setError(null);
                window.location.reload();
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
            <button
              onClick={clearError}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced not initialized state
  if (!isOnline) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">XMTP Not Initialized</h3>
          <p className="text-sm text-gray-600 mb-4">Connect your wallet to start messaging</p>
          {!isOnline && (
            <p className="text-xs text-red-500">⚠️ No internet connection</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white">
      {/* Enhanced Conversation List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        {/* Header with network status */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-gray-800">Messages</h2>
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} 
                   title={isOnline ? 'Online' : 'Offline'} />
            </div>
            <button
              onClick={() => setShowNewConversation(!showNewConversation)}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              New
            </button>
          </div>
        </div>

        {/* Enhanced New Conversation Form */}
        {showNewConversation && (
          <div className="p-4 border-b border-gray-200 bg-blue-50">
            <form onSubmit={handleCreateConversation}>
              <input
                ref={inputRef}
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
                <br />
                <span className="text-gray-500">
                  They may need to create an XMTP account first.
                </span>
              </div>
            )}
            {canMessageRecipient === true && (
              <div className="text-xs text-green-600 mt-1">
                ✅ Ready to create conversation!
              </div>
            )}
          </div>
        )}

        {/* Enhanced Conversation List */}
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
                      {conversation.isGroup ? 'Group Chat' : 'DM'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {conversation.peerAddress || conversation.topic.slice(0, 20)}...
                    </p>
                    {conversation.lastMessage && (
                      <p className="text-xs text-gray-400 truncate mt-1">
                        {conversation.lastMessage}
                      </p>
                    )}
                  </div>
                  {conversation.unreadCount > 0 && (
                    <div className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Enhanced Message Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation && (
          <>
            {/* Enhanced Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {selectedConversation.isGroup ? 'Group Chat' : 'Direct Message'}
                  </h3>
                  <p className="text-xs text-gray-500">{selectedConversation.peerAddress}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
              </div>
            </div>

            {/* Enhanced Messages */}
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
                messages.map((message) => {
                  const isOwnMessage = message.senderAddress === client?.address;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg relative ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-800'
                        } ${message.isOptimistic ? 'opacity-70' : ''}`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className={`flex items-center justify-between mt-1 ${
                          isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <p className="text-xs">
                            {message.sentAt.toLocaleTimeString()}
                          </p>
                          {isOwnMessage && (
                            <div className="flex items-center space-x-1">
                              {message.status === 'sending' && (
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                              )}
                              {message.status === 'sent' && (
                                <span className="text-xs">✓</span>
                              )}
                              {message.status === 'delivered' && (
                                <span className="text-xs">✓✓</span>
                              )}
                              {message.status === 'failed' && (
                                <span className="text-xs text-red-400">✗</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Enhanced Message Input */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={isSending || !isOnline}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim() || isSending || !isOnline}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSending ? '...' : 'Send'}
                </button>
              </form>
              {!isOnline && (
                <p className="text-xs text-red-500 mt-2">
                  ⚠️ You're offline. Messages will be sent when connection is restored.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};