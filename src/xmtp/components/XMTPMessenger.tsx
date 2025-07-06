import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useXMTP } from '../contexts/useXMTPContext';
import { useXMTPClient } from '../hooks/useXMTP';
import type { Message, Conversation } from '../types';
import { 
  ConsentState, 
  type Dm, 
  type DecodedMessage, 
  type Group, 
  type Identifier
} from '@xmtp/browser-sdk';

export const XMTPMessenger: React.FC = () => {
  const { isConnecting, isInitialized } = useXMTP();
  const client = useXMTPClient();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations using official XMTP V3 3.0.3 patterns
  const loadConversations = useCallback(async () => {
    if (!client) return;
    
    setIsLoading(true);
    try {
      // First sync conversations to ensure we have the latest state
      await client.conversations.sync();
      
      // Use official XMTP V3 pattern with consent state filtering
      const convs = await client.conversations.list({ consentStates: [ConsentState.Allowed] });
      
      const enhancedConversations: Conversation[] = await Promise.all(
        convs.map(async (conv) => {
          const isGroup = 'name' in conv; // Group has 'name' property, Dm doesn't
          let peerAddress: string | undefined;
          
          if (!isGroup) {
            try {
              // Use the proper method for getting peer inbox ID in V3 3.0.3
              peerAddress = await (conv as Dm<unknown>).peerInboxId();
            } catch (error) {
              console.warn('[XMTP] Failed to get peer inbox ID:', error);
            }
          }
          
          return {
            id: conv.id, // XMTP V3 uses 'id'
            peerAddress,
            isGroup,
            conversation: conv as Dm<unknown> | Group<unknown>, // Store the actual XMTP conversation object
          };
        })
      );
      
      setConversations(enhancedConversations);
      console.log(`[XMTP] Loaded ${enhancedConversations.length} conversations`);
    } catch (error) {
      console.error('[XMTP] Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  // Load messages using official XMTP V3 3.0.3 patterns
  const loadMessages = useCallback(async (conversation: Conversation) => {
    if (!client || !conversation.conversation) return;
    
    try {
      // Sync messages first to ensure we have the latest state
      await conversation.conversation.sync();
      
      const msgs = await conversation.conversation.messages({ limit: BigInt(50) });
      const enhancedMessages: Message[] = msgs.map((msg: DecodedMessage<unknown>) => ({
        id: msg.id,
        content: String(msg.content || ''),
        senderAddress: msg.senderInboxId, // Use senderInboxId instead of senderAddress
        sentAt: new Date(Number(msg.sentAtNs) / 1000000), // Convert nanoseconds to milliseconds
      }));
      setMessages(enhancedMessages);
    } catch (error) {
      console.error('[XMTP] Failed to load messages:', error);
    }
  }, [client]);

  // Create conversation using official XMTP V3 3.0.3 patterns
  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipient.trim() || !client) return;
    
    try {
      // Use official XMTP V3 browser-sdk pattern for creating conversations with identifier
      const identifier: Identifier = {
        identifier: newRecipient.trim().toLowerCase(),
        identifierKind: 'Ethereum',
      };
      
      const conversation = await client.conversations.newDmWithIdentifier(identifier);
      
      const newConversation: Conversation = {
        id: conversation.id, // XMTP V3 uses 'id'
        peerAddress: newRecipient.trim(),
        isGroup: false,
        conversation: conversation as Dm<unknown>, // Store the actual XMTP conversation object
      };
      
      setConversations(prev => [newConversation, ...prev]);
      setSelectedConversation(newConversation);
      setNewRecipient('');
      setShowNewConversation(false);
      console.log('[XMTP] Created new conversation:', conversation.id);
    } catch (error) {
      console.error('[XMTP] Failed to create conversation:', error);
      alert('Failed to create conversation. Please check the address and try again.');
    }
  };

  // Send message using official XMTP V3 3.0.3 patterns
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || isSending || !selectedConversation?.conversation) return;
    
    const messageContent = messageText.trim();
    setMessageText('');
    setIsSending(true);
    
    try {
      // Use the stored conversation object directly
      const messageId = await selectedConversation.conversation.send(messageContent);
      
      // Add message to local state (optimistic update)
      const newMessage: Message = {
        id: messageId,
        content: messageContent,
        senderAddress: client!.inboxId || '',
        sentAt: new Date(),
      };
      setMessages(prev => [...prev, newMessage]);
      console.log('[XMTP] Message sent successfully:', messageId);
    } catch (error) {
      console.error('[XMTP] Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Message streaming using official XMTP V3 3.0.3 patterns
  useEffect(() => {
    if (!client || !isInitialized) return;

    let messageStream: AsyncIterable<DecodedMessage<unknown>> | null = null;
    let isStreamActive = true;

    const startMessageStream = async () => {
      try {
        // Use XMTP V3 browser-sdk streaming pattern with consent state filtering
        messageStream = (await client.conversations.streamAllMessages(
          undefined, // callback
          undefined, // conversationType
          [ConsentState.Allowed] // consentStates - official pattern
        )) as AsyncIterable<DecodedMessage<unknown>>;
        
        // Stream messages using async iterator pattern
        for await (const message of messageStream) {
          if (!isStreamActive) break; // Check if stream should stop
          
          const newMessage: Message = {
            id: message.id,
            content: String(message.content || ''),
            senderAddress: message.senderInboxId, // Use senderInboxId instead of senderAddress
            sentAt: new Date(Number(message.sentAtNs) / 1000000), // Convert nanoseconds to milliseconds
          };
          
          setMessages(prev => {
            // Prevent duplicates
            if (prev.some(msg => msg.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      } catch (error) {
        console.error('[XMTP] Message stream error:', error);
      }
    };

    startMessageStream();

    return () => {
      isStreamActive = false;
      if (messageStream) {
        try {
          // Use official V3 3.0.3 stream cleanup pattern
          const stream = messageStream as AsyncIterable<DecodedMessage<unknown>> & { return?: () => void };
          if (stream.return) {
            stream.return();
          }
        } catch (error) {
          console.error('[XMTP] Error closing message stream:', error);
        }
      }
    };
  }, [client, isInitialized]);

  // Load conversations on mount
  useEffect(() => {
    if (client && isInitialized) {
      loadConversations();
    }
  }, [client, isInitialized, loadConversations]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">XMTP Not Initialized</h3>
          <p className="text-sm text-gray-600">Connect your wallet to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white">
      {/* Conversation List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
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
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <form onSubmit={handleCreateConversation} className="space-y-3">
              <input
                type="text"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!newRecipient.trim()}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Create Chat
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
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
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
                key={conversation.id}
                onClick={() => {
                  setSelectedConversation(conversation);
                  loadMessages(conversation);
                }}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <p className="text-sm font-medium text-gray-900">
                  {conversation.isGroup 
                    ? 'Group Chat' 
                    : `${conversation.peerAddress?.slice(0, 6)}...${conversation.peerAddress?.slice(-4)}`
                  }
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-800">
                {selectedConversation.isGroup 
                  ? 'Group Chat' 
                  : `${selectedConversation.peerAddress?.slice(0, 6)}...${selectedConversation.peerAddress?.slice(-4)}`
                }
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderAddress === client?.inboxId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderAddress === client?.inboxId
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {message.sentAt.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
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
        ) : (
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