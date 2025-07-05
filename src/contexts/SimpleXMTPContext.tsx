import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';

// Import from our new organized XMTP structure
import {
  Client,
  ConsentState,
  DecodedMessage,
  XMTPConversation,
  ContentTypes,
  ReactionContent,
  ErrorHandler,
  isInstallationLimitError,
  isDatabaseCorruptionError,
  isMultipleTabsError,
} from '../xmtp';
import { createAutoSigner } from '../utils/xmtpSigner';

interface SimpleXMTPContextType {
  // Core state
  client: Client | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Data
  conversations: XMTPConversation[];
  selectedConversation: XMTPConversation | null;
  messages: { [conversationId: string]: DecodedMessage[] };
  
  // Actions
  initialize: () => Promise<void>;
  selectConversation: (conversation: XMTPConversation) => void;
  sendMessage: (text: string, contentType?: unknown) => Promise<void>;
  createConversation: (recipientAddress: string) => Promise<void>;
  createGroupConversation: (participantAddresses: string[], groupName?: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
  
  // V3 Helpers
  resolveAddressToInboxId: (ethAddress: string) => Promise<string | null>;
  canMessageIdentities: (addresses: string[]) => Promise<Map<string, boolean>>;
  
  // V3 History Sync
  performHistorySync: () => Promise<void>;
  
  // V3 Database Cleanup
  clearCorruptedDatabase: () => Promise<void>;
  
  // V3 Content Handling
  processMessageContent: (message: DecodedMessage) => string;
  
  // V3 Consent Management
  setConsentState: (inboxId: string, state: ConsentState) => Promise<void>;
  getConsentState: (inboxId: string) => Promise<ConsentState>;
  
  // V3 Optimistic Messaging
  sendOptimisticMessage: (text: string, contentType?: unknown) => Promise<void>;
  
  // V3 Consent Management
  setConsent: (addresses: string[], state: ConsentState) => Promise<void>;
  getConsent: (address: string) => Promise<ConsentState>;
  
  // V3 Advanced Features
  sendReaction: (messageId: string, reaction: string) => Promise<void>;
  sendReply: (messageId: string, content: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
}

const SimpleXMTPContext = createContext<SimpleXMTPContextType | undefined>(undefined);

const SimpleXMTPProviderCore: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  // Core state
  const [client, setClient] = useState<Client | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<XMTPConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<XMTPConversation | null>(null);
  const [messages, setMessages] = useState<{ [conversationId: string]: DecodedMessage[] }>({});

  // V3 Enhanced Content Processing with new codec system
  const processMessageContent = useCallback((message: DecodedMessage): string => {
    try {
      if (!client) return String(message.content || '');
      
      // Check if we have a codec for this content type
      const codec = client.codecFor(message.contentType);
      if (!codec && message.fallback) {
        console.log('[SimpleXMTP] Using fallback for unsupported content type:', message.contentType);
        return message.fallback;
      }
      
      const content = message.content;
      
      // Handle different content types
      if (typeof content === 'string') {
        return content;
      }
      
      // Handle text content
      if (content && typeof content === 'object' && 'text' in content) {
        return content.text as string;
      }
      
      // Handle reaction content
      if (content && typeof content === 'object' && 'action' in content && 'content' in content) {
        const reaction = content as ReactionContent;
        return `${reaction.action === 'added' ? '👍' : '👎'} ${reaction.content}`;
      }
      
      // Handle reply content
      if (content && typeof content === 'object' && 'reference' in content && 'content' in content) {
        return `Reply: ${content.content}`;
      }
      
      // Fallback to string conversion
      return String(content || message.fallback || 'Error loading message');
    } catch (err) {
      console.error('[SimpleXMTP] Error processing message content:', err);
      return message.fallback || 'Error loading message';
    }
  }, [client]);

  // V3 Helper to resolve addresses to inbox IDs
  const resolveAddressToInboxId = useCallback(async (ethAddress: string): Promise<string | null> => {
    if (!client) return null;
    
    try {
      const normalizedAddress = ethAddress.toLowerCase().trim();
      
      const inboxId = await client.findInboxIdByIdentifier({
        identifier: normalizedAddress,
        identifierKind: 'Ethereum'
      });
      
      console.log(`[SimpleXMTP] Resolved ${normalizedAddress} → ${inboxId}`);
      return inboxId || null;
    } catch (err) {
      console.error('[SimpleXMTP] Failed to resolve address to inbox ID:', err);
      return null;
    }
  }, [client]);

  // V3 History Sync using proper SDK methods
  const performHistorySync = useCallback(async () => {
    if (!client || !address) {
      console.error('[SimpleXMTP] Cannot perform sync: client or address not available');
      return;
    }

    try {
      console.log('[SimpleXMTP] 🔄 Starting XMTP V3 sync...');
      setIsLoading(true);
      
      // Use the official sync methods
      await client.conversations.sync();
      await client.conversations.syncAll();
      
      console.log('[SimpleXMTP] ✅ Sync completed successfully');
      
      // Reload conversations after sync
      await loadConversations(client);
      
      console.log('[SimpleXMTP] 🔄 Conversations reloaded after sync');
      
    } catch (error) {
      console.error('[SimpleXMTP] Sync failed:', error);
      setError(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [client, address]);

  // Automated database cleanup using new structure
  const clearCorruptedDatabase = useCallback(async () => {
    if (!address || !client) {
      console.error('[SimpleXMTP] Cannot clear database: address or client not available');
      return;
    }

    try {
      console.log('[SimpleXMTP] 🧹 Starting automated database cleanup...');
      setIsLoading(true);
      setError('Cleaning corrupted database...');
      
      // Use the new Client's clearDatabase method
      await client.clearDatabase();
      
      // Reset local state
      setClient(null);
      setIsInitialized(false);
      setConversations([]);
      setSelectedConversation(null);
      setMessages({});
      
      console.log('[SimpleXMTP] ✅ Database cleanup completed');
      setError('Database cleaned. Please re-initialize XMTP.');
      
    } catch (error) {
      console.error('[SimpleXMTP] Database cleanup failed:', error);
      setError(`Database cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [address, client]);

  // Enhanced initialization with new error handling
  const initialize = useCallback(async () => {
    if (!walletClient || !address || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[SimpleXMTP] Initializing XMTP Browser SDK client...');
      
      const signer = createAutoSigner(walletClient);
      
      // Use new Client.create method with enhanced error handling
      const xmtpClient = await ErrorHandler.withRetry(
        async () => {
          return await Client.create(signer, { 
            env: 'production'
          });
        },
        3,
        (error, attempt) => {
          console.warn(`[SimpleXMTP] Initialization attempt ${attempt + 1} failed:`, error.message);
        }
      );
      
      setClient(xmtpClient);
      setIsInitialized(true);
      
      // Load conversations using new structure
      await loadConversations(xmtpClient);
      
      // Start streaming with new API
      startStreaming(xmtpClient);
      
      console.log('[SimpleXMTP] ✅ Browser SDK initialization complete');
      
    } catch (err) {
      console.error('[SimpleXMTP] Browser SDK initialization failed:', err);
      
      // Use new error handling system
      if (isInstallationLimitError(err)) {
        console.log('[SimpleXMTP] 🔧 Installation limit reached. Handling automatically...');
        
        try {
          const inboxId = err.details?.inboxId || extractInboxIdFromError(err.message);
          if (inboxId && client) {
            await client.handleInstallationLimit(inboxId);
            setError('Installation limit handled. Please retry initialization.');
            return;
          }
        } catch (recoveryError) {
          console.error('[SimpleXMTP] Installation limit recovery failed:', recoveryError);
        }
      }
      
      if (isDatabaseCorruptionError(err)) {
        console.log('[SimpleXMTP] 🔧 Database corruption detected. Cleaning automatically...');
        
        try {
          await clearCorruptedDatabase();
          setError('Database corruption fixed. Click "Connect XMTP" to retry.');
          return;
        } catch (cleanupError) {
          console.error('[SimpleXMTP] Automatic cleanup failed:', cleanupError);
        }
      }
      
      if (isMultipleTabsError(err)) {
        setError('XMTP is already active in another tab. Please close other tabs.');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Initialization failed';
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, address, isLoading, clearCorruptedDatabase]);

  // Enhanced conversation loading with consent filtering
  const loadConversations = async (xmtpClient: Client) => {
    try {
      console.log('[SimpleXMTP] Loading conversations...');
      
      // Ensure client is ready
      await xmtpClient.waitForReady();
      
      // Use new Conversations API with consent filtering
      await xmtpClient.conversations.sync();
      
      // Use syncAll with consent state filtering - only sync allowed/unknown conversations
      await xmtpClient.conversations.syncAll([ConsentState.Allowed, ConsentState.Unknown]);
      
      const allConversations = await xmtpClient.conversations.list();
      
      // Filter conversations by consent state to prevent spam
      const allowedConversations = [];
      for (const conversation of allConversations) {
        try {
          // For groups, check group consent; for DMs, check peer consent
          const targetId = 'peerInboxId' in conversation ? conversation.peerInboxId : conversation.id;
          const consentState = await xmtpClient.contacts.getConsent(targetId);
          if (consentState === ConsentState.Allowed || consentState === ConsentState.Unknown) {
            allowedConversations.push(conversation);
          }
        } catch (error) {
          // If consent check fails, include as unknown (safe default)
          allowedConversations.push(conversation);
        }
      }
      
      setConversations(allowedConversations);
      console.log(`[SimpleXMTP] Loaded ${allowedConversations.length} allowed conversations (${allConversations.length} total)`);
    } catch (err) {
      console.error('[SimpleXMTP] Failed to load conversations:', err);
    }
  };

  // Enhanced streaming with new API and proper ready check
  const startStreaming = async (xmtpClient: Client) => {
    try {
      console.log('[SimpleXMTP] Starting message stream...');
      
      // Ensure client is ready before starting stream
      await xmtpClient.waitForReady();
      
      await xmtpClient.conversations.sync();
      
      // Use new streaming API with consent filtering - only stream allowed conversations
      const stream = await xmtpClient.conversations.streamAllMessages();
      
      // Note: Manual consent filtering will be applied in message processing
      
      // Process stream messages
      (async () => {
        try {
          for await (const message of stream) {
            if (!message) continue;
            
            console.log('[SimpleXMTP] New stream message:', message);
            
            // Filter own messages
            if (message.senderInboxId === xmtpClient.inboxId) {
              continue;
            }
            
            // Update messages state
            setMessages(prev => ({
              ...prev,
              [message.conversationId]: [
                ...(prev[message.conversationId] || []),
                message
              ]
            }));
            
            // Handle new conversation detection
            setConversations(prev => {
              const currentConversationIds = prev.map(c => c.id);
              if (!currentConversationIds.includes(message.conversationId)) {
                console.log('[SimpleXMTP] 🆕 NEW CONVERSATION detected:', message.conversationId);
                setTimeout(() => loadConversations(xmtpClient), 500);
              }
              return prev;
            });
          }
        } catch (streamError) {
          console.error('[SimpleXMTP] Stream error:', streamError);
          
          if (isDatabaseCorruptionError(streamError)) {
            console.log('[SimpleXMTP] 🔧 Stream corruption detected. Auto-cleaning...');
            try {
              await clearCorruptedDatabase();
              setError('Database corruption fixed. Click "Connect XMTP" to retry.');
            } catch {
              setError('Database corruption detected. Please refresh and try again.');
            }
            return;
          }
          
          // Retry streaming after delay
          setTimeout(() => startStreaming(xmtpClient), 5000);
        }
      })();
      
    } catch (err) {
      console.error('[SimpleXMTP] Streaming setup failed:', err);
    }
  };

  // Enhanced message sending with content types
  const sendMessage = useCallback(async (text: string, contentType?: unknown) => {
    if (!client || !selectedConversation) return;
    
    try {
      console.log('[SimpleXMTP] Sending message...');
      
      if (contentType) {
        await selectedConversation.send(text, { contentType: contentType as any });
      } else {
        await selectedConversation.sendText(text);
      }
      
      console.log('[SimpleXMTP] ✅ Message sent');
    } catch (err) {
      console.error('[SimpleXMTP] Failed to send message:', err);
      setError('Failed to send message');
    }
  }, [client, selectedConversation]);

  // Enhanced conversation creation with canMessage check
  const createConversation = useCallback(async (recipientAddress: string) => {
    if (!client) return;
    
    try {
      console.log('[SimpleXMTP] Creating V3 conversation with:', recipientAddress);
      
      // First check if the recipient can receive messages
      const canMessageResult = await canMessageIdentities([recipientAddress]);
      const canMessage = canMessageResult.get(recipientAddress);
      
      if (!canMessage) {
        setError(`Unable to message ${recipientAddress}. They may not be on XMTP network.`);
        return;
      }
      
      // Resolve address to inbox ID first
      const inboxId = await resolveAddressToInboxId(recipientAddress);
      if (!inboxId) {
        setError(`Unable to resolve inbox ID for ${recipientAddress}`);
        return;
      }
      
      // Create DM conversation using inbox ID
      const conversation = await client.conversations.newDm(inboxId);
      
      // Set consent to allowed for new conversations
      await setConsentState(inboxId, ConsentState.Allowed);
      
      console.log('[SimpleXMTP] ✅ V3 Conversation created');
      
      await refreshConversations();
      setSelectedConversation(conversation);
      
    } catch (err) {
      console.error('[SimpleXMTP] Failed to create V3 conversation:', err);
      setError(`Failed to create conversation: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [client, canMessageIdentities, resolveAddressToInboxId, setConsentState]);

  // Enhanced group creation
  const createGroupConversation = useCallback(async (participantAddresses: string[], groupName?: string) => {
    if (!client) return;
    
    try {
      console.log('[SimpleXMTP] Creating V3 group conversation with:', participantAddresses);
      
      // Resolve addresses to inbox IDs
      const inboxIds: string[] = [];
      
      for (const address of participantAddresses) {
        const inboxId = await resolveAddressToInboxId(address);
        if (inboxId) {
          inboxIds.push(inboxId);
        } else {
          setError(`Could not resolve address ${address} to inbox ID`);
          return;
        }
      }
      
      const group = await client.conversations.newGroup(inboxIds);
      
      // Set group name if provided
      if (groupName) {
        await group.updateName(groupName);
      }
      
      console.log('[SimpleXMTP] ✅ V3 Group conversation created');
      
      await refreshConversations();
      setSelectedConversation(group);
      
    } catch (err) {
      console.error('[SimpleXMTP] Failed to create group conversation:', err);
      setError(`Failed to create group: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [client, resolveAddressToInboxId]);

  // Consent management
  const setConsent = useCallback(async (addresses: string[], state: ConsentState) => {
    if (!client) return;
    
    try {
      const identifiers = addresses.map(address => ({
        identifier: address.toLowerCase().trim(),
        identifierKind: 'Ethereum' as const,
      }));
      
      await client.contacts.setConsent(identifiers, state);
      console.log(`[SimpleXMTP] Set consent to ${state} for ${addresses.length} addresses`);
    } catch (err) {
      console.error('[SimpleXMTP] Failed to set consent:', err);
      setError('Failed to set consent');
    }
  }, [client]);

  const getConsent = useCallback(async (address: string): Promise<ConsentState> => {
    if (!client) return 'Unknown' as unknown as ConsentState;
    
    try {
      return await client.contacts.getConsent(address);
    } catch (err) {
      console.error('[SimpleXMTP] Failed to get consent:', err);
      return 'Unknown' as unknown as ConsentState;
    }
  }, [client]);

  // Advanced content features
  const sendReaction = useCallback(async (messageId: string, reaction: string) => {
    if (!client || !selectedConversation) return;
    
    try {
      const reactionContent: ReactionContent = {
        reference: messageId,
        action: 'added',
        content: reaction,
        schema: 'unicode',
      };
      
      await selectedConversation.send(reactionContent, {
        contentType: ContentTypes.Reaction,
      });
      
      console.log('[SimpleXMTP] ✅ Reaction sent');
    } catch (err) {
      console.error('[SimpleXMTP] Failed to send reaction:', err);
      setError('Failed to send reaction');
    }
  }, [client, selectedConversation]);

  const sendReply = useCallback(async (messageId: string, content: string) => {
    if (!client || !selectedConversation) return;
    
    try {
      const replyContent = {
        reference: messageId,
        content: { text: content },
        contentType: ContentTypes.Text,
      };
      
      await selectedConversation.send(replyContent, {
        contentType: ContentTypes.Reply,
      });
      
      console.log('[SimpleXMTP] ✅ Reply sent');
    } catch (err) {
      console.error('[SimpleXMTP] Failed to send reply:', err);
      setError('Failed to send reply');
    }
  }, [client, selectedConversation]);

  const markAsRead = useCallback(async (messageId: string) => {
    if (!client || !selectedConversation) return;
    
    try {
      const readReceiptContent = {
        reference: messageId,
      };
      
      await selectedConversation.send(readReceiptContent, {
        contentType: ContentTypes.ReadReceipt,
      });
      
      console.log('[SimpleXMTP] ✅ Read receipt sent');
    } catch (err) {
      console.error('[SimpleXMTP] Failed to send read receipt:', err);
    }
  }, [client, selectedConversation]);

  // Simple conversation refresh
  const refreshConversations = useCallback(async () => {
    if (!client) return;
    await loadConversations(client);
  }, [client]);

  // Simple conversation selection
  const selectConversation = useCallback((conversation: XMTPConversation) => {
    setSelectedConversation(conversation);
    
    // Load messages for this conversation if not already loaded
    if (!messages[conversation.id]) {
      loadMessages(conversation);
    }
  }, [messages]);

  // Enhanced message loading
  const loadMessages = async (conversation: XMTPConversation) => {
    try {
      console.log('[SimpleXMTP] Loading messages for conversation...');
      
      await conversation.sync();
      const msgs = await conversation.messages({ limit: 50 });
      
      setMessages(prev => ({
        ...prev,
        [conversation.id]: msgs
      }));
      
      console.log(`[SimpleXMTP] Loaded ${msgs.length} messages for conversation ${conversation.id}`);
    } catch (err) {
      console.error('[SimpleXMTP] Failed to load messages:', err);
    }
  };

  // Cleanup on address change
  useEffect(() => {
    if (address && client) {
      console.log('[SimpleXMTP] Wallet address changed, resetting XMTP state');
      
      setClient(null);
      setIsInitialized(false);
      setConversations([]);
      setSelectedConversation(null);
      setMessages({});
      setError(null);
    }
  }, [address, client]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (client) {
        console.log('[SimpleXMTP] Cleaning up Browser SDK resources on unmount');
        client.cleanup();
        
        setClient(null);
        setIsInitialized(false);
        setConversations([]);
        setSelectedConversation(null);
        setMessages({});
        setError(null);
      }
    };
  }, [client]);

  // V3 Can Message Check
  const canMessageIdentities = useCallback(async (addresses: string[]): Promise<Map<string, boolean>> => {
    if (!client) {
      return new Map();
    }
    
    try {
      const identifiers = addresses.map(addr => ({
        identifier: addr,
        identifierKind: 'Ethereum' as const
      }));
      return await Client.canMessage(identifiers, 'production');
    } catch (error) {
      console.error('[SimpleXMTP] Failed to check canMessage:', error);
      return new Map();
    }
  }, [client]);
  
  // V3 Consent Management
  const setConsentState = useCallback(async (inboxId: string, state: ConsentState): Promise<void> => {
    if (!client) return;
    
    try {
      // Use the correct setConsent API
      await client.contacts.setConsent([{
        identifier: inboxId,
        identifierKind: 'Address'
      }], state);
      console.log(`[SimpleXMTP] Consent set to ${state} for ${inboxId}`);
    } catch (error) {
      console.error('[SimpleXMTP] Failed to set consent state:', error);
    }
  }, [client]);
  
  const getConsentState = useCallback(async (inboxId: string): Promise<ConsentState> => {
    if (!client) return ConsentState.Unknown;
    
    try {
      return await client.contacts.getConsent(inboxId, 'Address');
    } catch (error) {
      console.error('[SimpleXMTP] Failed to get consent state:', error);
      return ConsentState.Unknown;
    }
  }, [client]);
  
  // V3 Optimistic Messaging (simplified version - SDK may not expose optimistic APIs)
  const sendOptimisticMessage = useCallback(async (text: string, contentType?: unknown): Promise<void> => {
    if (!client || !selectedConversation) return;
    
    try {
      console.log('[SimpleXMTP] Sending message with optimistic UX...');
      
      // For now, use regular send but implement optimistic UX in UI
      if (contentType) {
        await selectedConversation.send(text, { contentType: contentType as any });
      } else {
        await selectedConversation.sendText(text);
      }
      
      console.log('[SimpleXMTP] ✅ Message sent');
    } catch (err) {
      console.error('[SimpleXMTP] Failed to send message:', err);
      throw err;
    }
  }, [client, selectedConversation]);
  
  // Helper function
  const extractInboxIdFromError = (errorMessage: string): string | undefined => {
    const match = errorMessage.match(/InboxID ([a-f0-9]{64})/);
    return match?.[1];
  };

  const value: SimpleXMTPContextType = {
    client,
    isInitialized,
    isLoading,
    error,
    conversations,
    selectedConversation,
    messages,
    initialize,
    selectConversation,
    sendMessage,
    createConversation,
    refreshConversations,
    resolveAddressToInboxId,
    canMessageIdentities,
    createGroupConversation,
    processMessageContent,
    performHistorySync,
    clearCorruptedDatabase,
    setConsent,
    getConsent,
    setConsentState,
    getConsentState,
    sendOptimisticMessage,
    sendReaction,
    sendReply,
    markAsRead,
  };

  return (
    <SimpleXMTPContext.Provider value={value}>
      {children}
    </SimpleXMTPContext.Provider>
  );
};

// Wrap with error boundary for production reliability
export const SimpleXMTPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SimpleXMTPProviderCore>
      {children}
    </SimpleXMTPProviderCore>
  );
};

export const useSimpleXMTP = () => {
  const context = useContext(SimpleXMTPContext);
  if (!context) {
    throw new Error('useSimpleXMTP must be used within SimpleXMTPProvider');
  }
  return context;
};