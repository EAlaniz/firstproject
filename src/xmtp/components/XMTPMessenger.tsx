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
import { useWalletClient } from 'wagmi';

export const XMTPMessenger: React.FC = () => {
  const { isConnecting, isInitialized, error, clearXMTPData, revokeOtherInstallations } = useXMTP();
  const client = useXMTPClient();
  const { data: walletClient } = useWalletClient();

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
      // Official V3 3.0.3 pattern: Load messages without additional sync
      // The conversation is already synced when loaded from conversations.list()
      const msgs = await conversation.conversation.messages({ limit: BigInt(50) });
      const enhancedMessages: Message[] = msgs.map((msg: DecodedMessage<unknown>) => ({
        id: msg.id,
        content: String(msg.content || ''),
        senderAddress: msg.senderInboxId, // Use senderInboxId from V3 3.0.3
        sentAt: new Date(Number(msg.sentAtNs) / 1000000), // Convert nanoseconds to milliseconds
      }));
      
      // Sort messages by timestamp to ensure proper order
      enhancedMessages.sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
      
      setMessages(enhancedMessages);
      console.log(`[XMTP] Loaded ${enhancedMessages.length} messages for conversation`);
    } catch (error) {
      console.error('[XMTP] Failed to load messages:', error);
    }
  }, [client]);

  // Create conversation using official XMTP V3 3.0.3 patterns with identity reachability check
  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipient.trim() || !client) return;
    
    try {
      const recipientAddress = newRecipient.trim().toLowerCase();
      
      // Official V3 3.0.3 pattern: Check identity reachability first
      console.log('[XMTP] Checking if recipient can receive messages...');
      const canMessage = await client.canMessage([recipientAddress]);
      
      if (!canMessage[recipientAddress]) {
        alert('This address cannot receive XMTP messages. Please ensure they have an XMTP identity.');
        return;
      }
      
      // Use official XMTP V3 browser-sdk pattern for creating conversations with identifier
      const identifier: Identifier = {
        identifier: recipientAddress,
        identifierKind: 'Ethereum',
      };
      
      const conversation = await client.conversations.newDmWithIdentifier(identifier);
      
      // Official V3 3.0.3 pattern: Set conversation consent to allowed for user-initiated conversations
      await conversation.updateConsentState(ConsentState.Allowed);
      console.log('[XMTP] Conversation consent set to allowed');
      
      const newConversation: Conversation = {
        id: conversation.id, // XMTP V3 uses 'id'
        peerAddress: recipientAddress,
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

  // Send message using official XMTP V3 3.0.3 patterns with optimistic UI
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || isSending || !selectedConversation?.conversation || !client) return;
    
    const messageContent = messageText.trim();
    setMessageText('');
    setIsSending(true);
    
    try {
      // Check conversation consent state - official V3 3.0.3 pattern
      const consentState = await selectedConversation.conversation.consentState();
      if (consentState === ConsentState.Denied) {
        alert('Cannot send message to this conversation. The conversation has been denied.');
        setMessageText(messageContent); // Restore text
        return;
      }
      
      // If consent is unknown, set to allowed for user-initiated messages
      if (consentState === ConsentState.Unknown) {
        await selectedConversation.conversation.updateConsentState(ConsentState.Allowed);
        console.log('[XMTP] Updated conversation consent to allowed');
      }
      
      // V3 3.0.3 pattern: Ensure conversation is synced before sending
      try {
        console.log('[XMTP] Syncing conversation before sending message...');
        await selectedConversation.conversation.sync();
      } catch (syncError) {
        console.warn('[XMTP] Conversation sync warning (continuing):', syncError);
      }
      
      // Official V3 3.0.3 optimistic sending pattern
      try {
        console.log('[XMTP] Sending message with optimistic UI...');
        
        // Send optimistic (immediately show in UI)
        await selectedConversation.conversation.sendOptimistic(messageContent);
        console.log('[XMTP] Message added optimistically to local UI');
        
        // Publish to network
        await selectedConversation.conversation.publishMessages();
        console.log('[XMTP] Message published to network successfully');
        
      } catch (sendError) {
        const errorMessage = sendError instanceof Error ? sendError.message : String(sendError);
        
        // Handle specific V3 3.0.3 error patterns
        if (errorMessage.includes('InboxValidationFailed') || errorMessage.includes('Intent') || errorMessage.includes('moved to error status')) {
          console.warn('[XMTP] Inbox validation issue detected, attempting full sync recovery...');
          
          // V3 3.0.3 recovery pattern: Full sync to resolve identity issues
          try {
            await client.conversations.syncAll();
            console.log('[XMTP] Full sync completed, retrying message send...');
            
            // Retry with standard send after sync
            const messageId = await selectedConversation.conversation.send(messageContent);
            console.log('[XMTP] Message sent successfully after recovery:', messageId);
            return; // Success, exit function
          } catch (retryError) {
            console.error('[XMTP] Message send failed even after recovery:', retryError);
            throw new Error('Message sending failed due to identity synchronization issues. Please try reconnecting XMTP.');
          }
        } else {
          // Re-throw other errors
          throw sendError;
        }
      }
      
    } catch (error) {
      console.error('[XMTP] Failed to send message:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      let userMessage = 'Failed to send message. Please try again.';
      
      // Provide more specific error messages for common V3 issues
      if (errorMessage.includes('identity synchronization')) {
        userMessage = 'Identity sync issue. Please reconnect XMTP and try again.';
      } else if (errorMessage.includes('InboxValidationFailed')) {
        userMessage = 'Account validation issue. Please reconnect XMTP.';
      }
      
      alert(userMessage);
      
      // Restore message text on failure
      setMessageText(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  // Message streaming using official XMTP V3 3.0.3 patterns  
  useEffect(() => {
    if (!client || !isInitialized || !selectedConversation) return;

    let messageStream: any = null;
    let isStreamActive = true;

    const startMessageStream = async () => {
      try {
        // Use XMTP V3 browser-sdk streaming pattern with consent state filtering
        messageStream = await client.conversations.streamAllMessages(
          undefined, // callback
          undefined, // conversationType
          [ConsentState.Allowed] // consentStates - official pattern
        );
        
        console.log('[XMTP] Message stream started');
        
        // Stream messages using async iterator pattern
        for await (const message of messageStream) {
          if (!isStreamActive) break; // Check if stream should stop
          
          // Only add messages for the currently selected conversation
          if (message.conversationId === selectedConversation?.id) {
            const newMessage: Message = {
              id: message.id,
              content: String(message.content || ''),
              senderAddress: message.senderInboxId, // Use senderInboxId from V3 3.0.3
              sentAt: new Date(Number(message.sentAtNs) / 1000000), // Convert nanoseconds to milliseconds
            };
            
            setMessages(prev => {
              // Prevent duplicates and maintain chronological order
              if (prev.some(msg => msg.id === newMessage.id)) return prev;
              
              const updated = [...prev, newMessage];
              return updated.sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
            });
            
            console.log('[XMTP] New message received via stream:', newMessage.id);
          }
        }
      } catch (error) {
        // Official V3 3.0.3 pattern: Handle specific stream errors gracefully
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('group with welcome id') || errorMessage.includes('not found')) {
          console.warn('[XMTP] Stream warning (expected during sync):', errorMessage);
        } else {
          console.error('[XMTP] Message stream error:', error);
        }
      }
    };

    startMessageStream();

    return () => {
      isStreamActive = false;
      if (messageStream) {
        try {
          // Use official V3 3.0.3 stream cleanup pattern
          if (messageStream && typeof messageStream.return === 'function') {
            messageStream.return();
          }
        } catch (error) {
          console.error('[XMTP] Error closing message stream:', error);
        }
      }
    };
  }, [client, isInitialized, selectedConversation]);

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
          {error && error.message === 'installation_limit_reached' ? (
            <div className="space-y-4 max-w-md">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-orange-800 mb-2">
                  🚨 Installation Limit Reached
                </h4>
                <p className="text-xs text-orange-700 mb-3">
                  Your XMTP inbox has 5/5 installations (the maximum). Each browser/device creates a new installation.
                </p>
              </div>
              
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-700">Choose a solution:</p>
                
                {walletClient && (
                  <button
                    onClick={() => revokeOtherInstallations(walletClient)}
                    disabled={isConnecting}
                    className="w-full bg-blue-600 text-white px-4 py-3 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {isConnecting ? 'Revoking...' : '✨ Revoke Other Installations (Recommended)'}
                  </button>
                )}
                
                <button
                  onClick={clearXMTPData}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
                >
                  🗑️ Clear Local Data (Fallback)
                </button>
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Recommended:</strong> Revoke other installations to free up space.</p>
                <p><strong>Fallback:</strong> Clear local data, then refresh the page.</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">Connect your wallet to start messaging</p>
          )}
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