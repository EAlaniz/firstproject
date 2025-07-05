import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@xmtp/browser-sdk';
import { useSimpleXMTP } from '../contexts/SimpleXMTPContext';
import { useXMTPClient, useXMTPError } from '../contexts/useXMTPHooks';

// Enhanced message interface
interface EnhancedMessage {
  id: string;
  content: string;
  senderAddress: string;
  senderInboxId: string;
  sentAt: Date;
  status: 'sending' | 'sent' | 'delivered' | 'failed';
  isOptimistic?: boolean;
  cursor?: string;
}

// Enhanced conversation interface
interface EnhancedConversation {
  topic: string;
  peerAddress?: string;
  peerInboxId?: string;
  isGroup: boolean;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  messageCursor?: string;
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
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [localError, setError] = useState<string | null>(null);

  // Refs for real-time features with proper typing
  const messageStreamRef = useRef<unknown>(null);
  const conversationStreamRef = useRef<unknown>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Stream management state
  const [isStreamingMessages, setIsStreamingMessages] = useState(false);
  const [isStreamingConversations, setIsStreamingConversations] = useState(false);
  const streamRetryCountRef = useRef(0);
  const maxRetries = 3;

  // Enhanced error handling with retry logic
  const handleError = useCallback((error: unknown, context: string) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check for specific XMTP errors that we can handle gracefully
    if (errorMessage.includes('group with welcome id') || 
        errorMessage.includes('already processed') ||
        errorMessage.includes('already in group')) {
      console.warn(`[XMTP] ${context} warning (handled gracefully):`, errorMessage);
      return; // Don't treat these as errors, just warnings
    }
    
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

  // Enhanced message streaming with proper error handling
  const startMessageStream = useCallback(async () => {
    if (!client || !isOnline || isStreamingMessages) return;

    try {
      console.log('[XMTP] Starting real-time message stream...');
      setIsStreamingMessages(true);
      
      const stream = await client.conversations.streamAllMessages();
      messageStreamRef.current = stream as unknown;

      for await (const message of stream as unknown as AsyncIterableIterator<unknown>) {
        try {
          console.log('[XMTP] New message received:', message);
          
          // Add new message to state
          const enhancedMessage: EnhancedMessage = {
            id: (message as { id?: string }).id || `msg-${Date.now()}`,
            content: String((message as { content: unknown }).content || ''),
            senderAddress: (message as { senderAddress: string }).senderAddress,
            senderInboxId: (message as { senderInboxId?: string }).senderInboxId || (message as { senderAddress: string }).senderAddress,
            sentAt: (message as { sentAt?: Date }).sentAt ? new Date((message as { sentAt: Date }).sentAt) : new Date(),
            status: 'delivered',
            cursor: (message as { cursor?: string }).cursor,
          };

          setMessages(prev => [...prev, enhancedMessage]);
          
          // Update conversation list with latest message
          updateConversationWithMessage(enhancedMessage);
        } catch (messageError) {
          // Handle individual message processing errors gracefully
          console.warn('[XMTP] Error processing individual message:', messageError);
        }
      }
    } catch (error) {
      handleError(error, 'message stream');
      
      // Implement retry logic for stream errors
      if (streamRetryCountRef.current < maxRetries) {
        streamRetryCountRef.current++;
        console.log(`[XMTP] Retrying message stream (attempt ${streamRetryCountRef.current}/${maxRetries})...`);
        setTimeout(() => {
          setIsStreamingMessages(false);
          startMessageStream();
        }, 2000 * streamRetryCountRef.current); // Exponential backoff
      } else {
        console.error('[XMTP] Max retries reached for message stream');
        streamRetryCountRef.current = 0;
      }
    } finally {
      setIsStreamingMessages(false);
    }
  }, [client, isOnline, isStreamingMessages, handleError, updateConversationWithMessage]);

  // Enhanced conversation streaming with proper error handling
  const startConversationStream = useCallback(async () => {
    if (!client || !isOnline || isStreamingConversations) return;

    try {
      console.log('[XMTP] Starting real-time conversation stream...');
      setIsStreamingConversations(true);
      
      const stream = await client.conversations.stream();
      conversationStreamRef.current = stream as unknown;

      for await (const conversation of stream as unknown as AsyncIterableIterator<unknown>) {
        try {
          console.log('[XMTP] New conversation received:', conversation);
          
          // Add new conversation to state
          const enhancedConversation: EnhancedConversation = {
            topic: (conversation as { topic: string }).topic,
            peerAddress: (conversation as { peerAddress?: string }).peerAddress,
            peerInboxId: (conversation as { peerInboxId?: string }).peerInboxId,
            isGroup: !(conversation as { peerAddress?: string }).peerAddress,
            unreadCount: 0,
          };

          setConversations(prev => [enhancedConversation, ...prev]);
        } catch (conversationError) {
          // Handle individual conversation processing errors gracefully
          console.warn('[XMTP] Error processing individual conversation:', conversationError);
        }
      }
    } catch (error) {
      handleError(error, 'conversation stream');
      
      // Implement retry logic for stream errors
      if (streamRetryCountRef.current < maxRetries) {
        streamRetryCountRef.current++;
        console.log(`[XMTP] Retrying conversation stream (attempt ${streamRetryCountRef.current}/${maxRetries})...`);
        setTimeout(() => {
          setIsStreamingConversations(false);
          startConversationStream();
        }, 2000 * streamRetryCountRef.current); // Exponential backoff
      } else {
        console.error('[XMTP] Max retries reached for conversation stream');
        streamRetryCountRef.current = 0;
      }
    } finally {
      setIsStreamingConversations(false);
    }
  }, [client, isOnline, isStreamingConversations, handleError]);

  // Enhanced stream cleanup
  const stopMessageStream = useCallback(() => {
    if (messageStreamRef.current) {
      try {
        const stream = messageStreamRef.current as { return?: () => void };
        if (typeof stream.return === 'function') {
          stream.return();
        }
        messageStreamRef.current = null;
        setIsStreamingMessages(false);
        console.log('[XMTP] Message stream stopped');
      } catch (error) {
        console.error('[XMTP] Error stopping message stream:', error);
      }
    }
  }, []);

  const stopConversationStream = useCallback(() => {
    if (conversationStreamRef.current) {
      try {
        const stream = conversationStreamRef.current as { return?: () => void };
        if (typeof stream.return === 'function') {
          stream.return();
        }
        conversationStreamRef.current = null;
        setIsStreamingConversations(false);
        console.log('[XMTP] Conversation stream stopped');
      } catch (error) {
        console.error('[XMTP] Error stopping conversation stream:', error);
      }
    }
  }, []);

  // Network connectivity detection with enhanced reconnection logic
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('[XMTP] Network connection restored');
      streamRetryCountRef.current = 0; // Reset retry count on reconnection
      
      // Reconnect streams when back online
      if (client && isInitialized) {
        setTimeout(() => {
          startMessageStream();
          startConversationStream();
        }, 1000); // Small delay to ensure connection is stable
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
  }, [client, isInitialized, startMessageStream, startConversationStream, stopMessageStream, stopConversationStream]);

  // Remove the separate loadConversations function since it's now inlined to prevent dependency loops

  // Enhanced message loading with cursor-based pagination and error handling
  const loadMessages = useCallback(async (conversation: EnhancedConversation, limit = 50, cursor?: string) => {
    if (!conversation || !client) return;
    
    const isLoadingMore = !!cursor;
    if (isLoadingMore) {
      setIsLoadingMoreMessages(true);
    } else {
      setIsLoadingMessages(true);
      setHasMoreMessages(true);
    }
    
    try {
      console.log('[XMTP] Loading messages...', { limit, cursor });
      // Get the actual conversation object from the client
      const actualConversation = await client.conversations.getConversationById(conversation.topic);
      if (!actualConversation) {
        throw new Error('Conversation not found');
      }
      
      // Build message options with cursor support
      const messageOptions: { limit: bigint; cursor?: bigint } = { limit: BigInt(limit) };
      if (cursor) {
        messageOptions.cursor = BigInt(cursor);
      }
      
      const msgs = await actualConversation.messages(messageOptions);
      
      const enhancedMessages: EnhancedMessage[] = msgs.map((msg: unknown) => ({
        id: (msg as { id?: string }).id || `msg-${Date.now()}`,
        content: String((msg as { content: unknown }).content || ''),
        senderAddress: (msg as { senderAddress: string }).senderAddress,
        senderInboxId: (msg as { senderInboxId?: string }).senderInboxId || (msg as { senderAddress: string }).senderAddress,
        sentAt: (msg as { sentAt?: Date }).sentAt ? new Date((msg as { sentAt: Date }).sentAt) : new Date(),
        status: 'delivered' as const,
        cursor: (msg as { cursor?: string }).cursor,
      }));
      
      if (isLoadingMore) {
        // Append older messages to the beginning
        setMessages(prev => [...enhancedMessages, ...prev]);
      } else {
        // Replace all messages
        setMessages(enhancedMessages);
      }
      
      // Update cursor for pagination
      if (enhancedMessages.length > 0) {
        const oldestMessage = enhancedMessages[0];
        setConversations(prev => 
          prev.map(conv => 
            conv.topic === conversation.topic 
              ? { ...conv, messageCursor: oldestMessage.cursor }
              : conv
          )
        );
      }
      
      // Check if there are more messages
      setHasMoreMessages(enhancedMessages.length === limit);
      
      console.log(`[XMTP] Loaded ${enhancedMessages.length} messages`);
      
      // Auto-scroll to bottom only for initial load
      if (!isLoadingMore) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      handleError(error, 'load messages');
    } finally {
      setIsLoadingMessages(false);
      setIsLoadingMoreMessages(false);
    }
  }, [client, handleError]);
  
  // Load more messages (older messages)
  const loadMoreMessages = useCallback(async () => {
    if (!selectedConversation || !client || isLoadingMoreMessages || !hasMoreMessages) return;
    
    const cursor = conversations.find(c => c.topic === selectedConversation.topic)?.messageCursor;
    if (!cursor) return;
    
    await loadMessages(selectedConversation, 50, cursor);
  }, [selectedConversation, client, isLoadingMoreMessages, hasMoreMessages, conversations, loadMessages]);

  // Enhanced recipient checking with better error handling and inboxId support
  const checkRecipientCanMessage = async (recipient: string) => {
    if (!recipient.trim() || !client) {
      setCanMessageRecipient(null);
      return;
    }
    
    setCheckingRecipient(true);
    
    try {
      console.log('[XMTP] Checking if recipient can receive messages...');
      
      // For V3, we primarily use Ethereum addresses for canMessage checks
      // InboxId validation will be handled by the conversation creation process
      const identifierKind = 'Ethereum';
      
      const canMessageMap = await Client.canMessage(
        [{ identifier: recipient.trim(), identifierKind }],
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

  // Enhanced conversation creation with optimistic UI and inboxId support
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
      // Use the appropriate method for creating conversations in V3
      // Cast to unknown first then to our expected interface to handle API variations
      const conversations = client.conversations as unknown as {
        newDm?: (address: string) => Promise<{ topic: string; peerInboxId?: string }>;
        findOrCreateDm?: (address: string) => Promise<{ topic: string; peerInboxId?: string }>;
        newConversation?: (address: string) => Promise<{ topic: string; peerInboxId?: string }>;
      };
      
      let conversation: { topic: string; peerInboxId?: string } | undefined;
      
      // Try different methods for creating conversations
      if (conversations.newDm) {
        conversation = await conversations.newDm(newRecipient.trim());
      } else if (conversations.findOrCreateDm) {
        conversation = await conversations.findOrCreateDm(newRecipient.trim());
      } else if (conversations.newConversation) {
        conversation = await conversations.newConversation(newRecipient.trim());
      } else {
        throw new Error('No conversation creation method available');
      }
      
      if (!conversation) {
        throw new Error('Failed to create conversation');
      }
      
      // Optimistic UI update
      const newConversation: EnhancedConversation = {
        topic: conversation.topic,
        peerAddress: newRecipient.trim(),
        peerInboxId: (conversation as { peerInboxId?: string }).peerInboxId,
        isGroup: false,
        unreadCount: 0,
      };
      
      setConversations(prev => [newConversation, ...prev]);
      setSelectedConversation(newConversation);
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
      senderAddress: client?.inboxId || '',
      senderInboxId: client?.inboxId || '',
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
      // Get the actual conversation object from the client
      if (!client) {
        throw new Error('Client not available');
      }
      const actualConversation = await client.conversations.getConversationById(selectedConversation.topic);
      if (!actualConversation) {
        throw new Error('Conversation not found');
      }
      await actualConversation.send(messageContent);
      
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

  // Enhanced stream initialization with proper cleanup and race condition handling
  useEffect(() => {
    let isMounted = true;
    let streamTimeout: NodeJS.Timeout | undefined;
    
    if (client && isInitialized && isOnline && isMounted) {
      // Load conversations without dependency issues
      setIsLoadingConversations(true);
      (async () => {
        if (!client || !isMounted) return;
        
        try {
          console.log('[XMTP] Loading conversations...');
          const convs = await client.conversations.list();
          
          if (!isMounted) return;
          
          const enhancedConversations = convs.map((conv: unknown) => ({
            topic: (conv as { topic: string }).topic,
            peerAddress: (conv as { peerAddress?: string }).peerAddress,
            peerInboxId: (conv as { peerInboxId?: string }).peerInboxId,
            isGroup: !(conv as { peerAddress?: string }).peerAddress,
            unreadCount: 0,
          }));
          
          setConversations(enhancedConversations);
          setIsLoadingConversations(false);
          console.log(`[XMTP] Loaded ${enhancedConversations.length} conversations`);
        } catch (error) {
          if (isMounted) {
            setIsLoadingConversations(false);
            handleError(error, 'load conversations');
          }
        }
      })();
      
      // Start streams with a small delay to ensure client is ready
      streamTimeout = setTimeout(() => {
        if (isMounted) {
          startMessageStream();
          startConversationStream();
        }
      }, 500);
    }
    
    return () => {
      isMounted = false;
      if (streamTimeout) {
        clearTimeout(streamTimeout);
      }
      stopMessageStream();
      stopConversationStream();
    };
  }, [client, isInitialized, isOnline]); // Minimal dependencies to prevent loops

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
                streamRetryCountRef.current = 0;
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
  if (!isInitialized) {
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
              {(isStreamingMessages || isStreamingConversations) && (
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" 
                     title="Streaming active" />
              )}
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
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <form onSubmit={handleCreateConversation} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={newRecipient}
                  onChange={(e) => {
                    setNewRecipient(e.target.value);
                    checkRecipientCanMessage(e.target.value);
                  }}
                  placeholder="0x... or inbox_..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
              <p className="text-xs mt-1">Start a new conversation to begin messaging</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.topic}
                onClick={() => {
                  setSelectedConversation(conversation);
                  loadMessages(conversation);
                }}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation?.topic === conversation.topic ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conversation.isGroup ? 'Group Chat' : 'DM'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {conversation.peerInboxId || conversation.peerAddress || conversation.topic.slice(0, 20)}...
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
                  <p className="text-xs text-gray-500">
                    {selectedConversation.peerInboxId || selectedConversation.peerAddress}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                  {isStreamingMessages && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Load More Messages Button */}
              {hasMoreMessages && !isLoadingMessages && messages.length > 0 && (
                <div className="text-center">
                  <button
                    onClick={loadMoreMessages}
                    disabled={isLoadingMoreMessages}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingMoreMessages ? 'Loading...' : 'Load More Messages'}
                  </button>
                </div>
              )}
              
              {isLoadingMessages ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500">
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs mt-1">Send a message to start the conversation</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderInboxId === client?.inboxId ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderInboxId === client?.inboxId
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      } ${message.isOptimistic ? 'opacity-75' : ''}`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs opacity-75">
                          {message.sentAt.toLocaleTimeString()}
                        </span>
                        {message.senderInboxId === client?.inboxId && (
                          <span className="text-xs ml-2">
                            {message.status === 'sending' && '⏳'}
                            {message.status === 'sent' && '✓'}
                            {message.status === 'delivered' && '✓✓'}
                            {message.status === 'failed' && '❌'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Enhanced Message Input */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  disabled={isSending}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim() || isSending}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          </>
        )}

        {/* Enhanced Empty State */}
        {!selectedConversation && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <h3 className="text-lg font-semibold mb-2">Select a Conversation</h3>
              <p className="text-sm">Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};