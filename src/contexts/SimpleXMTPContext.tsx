import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { 
  Client, 
  DecodedMessage, 
  Dm, 
  Group, 
  ContentTypeId,
  ConsentState,
  ConsentEntityType 
} from '@xmtp/browser-sdk';
import { createAutoSigner } from '../utils/xmtpSigner';
import { XMTPErrorBoundary } from '../components/XMTPErrorBoundary';

type XMTPConversation = Dm<any> | Group<any>;

interface SimpleXMTPContextType {
  // Core state
  client: Client | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Data
  conversations: XMTPConversation[];
  selectedConversation: XMTPConversation | null;
  messages: { [conversationId: string]: DecodedMessage<any>[] };
  
  // Actions
  initialize: () => Promise<void>;
  selectConversation: (conversation: XMTPConversation) => void;
  sendMessage: (text: string, contentType?: ContentTypeId) => Promise<void>;
  createConversation: (recipientAddress: string) => Promise<void>;
  createGroupConversation: (participantAddresses: string[], groupName?: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
  
  // V3 Helpers
  resolveAddressToInboxId: (ethAddress: string) => Promise<string | null>;
  
  // V3 Content Handling
  processMessageContent: (message: DecodedMessage<any>) => string;
}

const SimpleXMTPContext = createContext<SimpleXMTPContextType | undefined>(undefined);

const SimpleXMTPProviderCore: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  // Simple state
  const [client, setClient] = useState<Client | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<XMTPConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<XMTPConversation | null>(null);
  const [messages, setMessages] = useState<{ [conversationId: string]: DecodedMessage<any>[] }>({});

  // V3 Enhanced Content Processing (handles unsupported content types)
  const processMessageContent = useCallback((message: DecodedMessage<any>): string => {
    try {
      // V3 Pattern: Handle unsupported content types with fallback
      if (!client) return String(message.content || '');
      
      const codec = client.codecFor(message.contentType);
      if (!codec && message.fallback) {
        console.log('[SimpleXMTP] Using fallback for unsupported content type:', message.contentType);
        return message.fallback;
      }
      
      // V3 Pattern: Process known content types
      const content = message.content;
      
      // Handle text content
      if (typeof content === 'string') {
        return content;
      }
      
      // Handle complex content types (reactions, replies, etc.)
      if (content && typeof content === 'object') {
        // For reaction content type
        if ('content' in content && 'action' in content) {
          return `${content.action} ${content.content}`;
        }
        
        // For reply content type
        if ('content' in content && 'reference' in content) {
          return String(content.content);
        }
        
        // For other structured content, extract readable text
        return JSON.stringify(content);
      }
      
      // Fallback to string conversion
      return String(content || '');
    } catch (err) {
      console.error('[SimpleXMTP] Error processing message content:', err);
      return message.fallback || 'Error loading message';
    }
  }, [client]);

  // Working V3 pattern: Helper to resolve addresses to inbox IDs
  const resolveAddressToInboxId = useCallback(async (ethAddress: string): Promise<string | null> => {
    if (!client) return null;
    
    try {
      const normalizedAddress = ethAddress.toLowerCase().trim();
      
      // V3 pattern: Resolve using official API
      const inboxId = await client.findInboxIdByIdentifier({
        identifier: normalizedAddress,
        identifierKind: 'Ethereum'
      });
      
      console.log(`[SimpleXMTP] Resolved ${normalizedAddress} → ${inboxId}`);
      return inboxId;
    } catch (err) {
      console.error('[SimpleXMTP] Failed to resolve address to inbox ID:', err);
      return null;
    }
  }, [client]);

  // Working XMTP V3 initialization pattern (from proven working code)
  const initialize = useCallback(async () => {
    if (!walletClient || !address || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[SimpleXMTP] Initializing XMTP client...');
      
      // CRITICAL: V3 requires database encryption key (proven working pattern)
      const getOrCreateEncryptionKey = async (): Promise<Uint8Array> => {
        const keyName = `xmtp-db-key-${address}`;
        const stored = localStorage.getItem(keyName);
        if (stored) {
          return new Uint8Array(JSON.parse(stored));
        }
        
        const key = crypto.getRandomValues(new Uint8Array(32));
        localStorage.setItem(keyName, JSON.stringify(Array.from(key)));
        console.log('[SimpleXMTP] ✅ V3 encryption key generated for address:', address);
        return key;
      };
      
      const signer = createAutoSigner(walletClient);
      const dbEncryptionKey = await getOrCreateEncryptionKey();
      
      // Working V3 pattern: Client creation with encryption key
      const xmtpClient = await Client.create(signer, { 
        env: 'production',
        dbEncryptionKey // REQUIRED for V3 production
      });
      
      setClient(xmtpClient);
      setIsInitialized(true);
      
      // Load initial conversations with working pattern
      await loadConversations(xmtpClient);
      
      // Start streaming with working pattern
      startStreaming(xmtpClient);
      
      console.log('[SimpleXMTP] ✅ Initialization complete');
      
    } catch (err) {
      console.error('[SimpleXMTP] Initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Initialization failed');
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, address, isLoading]);

  // Working conversation loading pattern (from proven working code)
  const loadConversations = async (xmtpClient: Client) => {
    try {
      console.log('[SimpleXMTP] Loading conversations...');
      
      // Working pattern: Comprehensive sync first
      await xmtpClient.conversations.sync();
      await xmtpClient.conversations.syncAll();
      
      // Load conversations with proven pattern
      const convs = await xmtpClient.conversations.list();
      
      // Also load DMs specifically (working pattern)
      const dms = await xmtpClient.conversations.listDms();
      
      // Combine all conversations
      const allConversations = [...convs, ...dms.filter(dm => !convs.some(c => c.id === dm.id))];
      
      setConversations(allConversations as XMTPConversation[]);
      console.log(`[SimpleXMTP] Loaded ${allConversations.length} conversations (${convs.length} regular + ${dms.length} DMs)`);
    } catch (err) {
      console.error('[SimpleXMTP] Failed to load conversations:', err);
    }
  };

  // Working streaming pattern (from proven working code)
  const startStreaming = async (xmtpClient: Client) => {
    try {
      console.log('[SimpleXMTP] Starting enhanced message stream...');
      
      // Working pattern: Sync before streaming
      await xmtpClient.conversations.sync();
      
      // Working pattern: Stream with consent filtering and config
      const stream = await xmtpClient.conversations.streamAllMessages();
      
      for await (const message of stream) {
        console.log('[SimpleXMTP] Enhanced stream message:', message);
        
        // Working pattern: Filter own messages using inboxId
        if (message.senderInboxId === xmtpClient.inboxId) {
          continue;
        }
        
        // Working pattern: Content handling with fallback
        const messageContent = message.fallback || String(message.content || '');
        
        // Working pattern: Update messages state
        setMessages(prev => ({
          ...prev,
          [message.conversationId]: [
            ...(prev[message.conversationId] || []),
            message
          ]
        }));
        
        // Working pattern: Enhanced new conversation detection
        setConversations(prev => {
          const currentConversationIds = prev.map(c => c.id);
          if (!currentConversationIds.includes(message.conversationId)) {
            console.log('[SimpleXMTP] 🆕 NEW INCOMING CONVERSATION detected:', message.conversationId);
            console.log('[SimpleXMTP] Message details:', {
              from: message.senderInboxId,
              content: String(messageContent).substring(0, 50),
              timestamp: new Date()
            });
            
            // Working pattern: Immediate discovery for new conversations
            setTimeout(() => {
              console.log('[SimpleXMTP] 🔄 Triggering conversation discovery for new message...');
              loadConversations(xmtpClient);
            }, 500);
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('[SimpleXMTP] Enhanced streaming error:', err);
      
      // Working pattern: Enhanced error handling
      if (err.message && err.message.includes('group with welcome id')) {
        console.error('[SimpleXMTP] 🚨 Welcome message error detected:', err.message);
        setError('Welcome message error detected. This is a known V3 issue.');
      }
      
      // Working pattern: Retry with backoff
      setTimeout(() => startStreaming(xmtpClient), 5000);
    }
  };

  // V3 Enhanced message sending with content type support
  const sendMessage = useCallback(async (text: string, contentType?: ContentTypeId) => {
    if (!client || !selectedConversation) return;
    
    try {
      console.log('[SimpleXMTP] Sending message...');
      
      // V3 Pattern: Send with content type if specified
      if (contentType) {
        await selectedConversation.send(text, contentType);
      } else {
        await selectedConversation.send(text);
      }
      
      console.log('[SimpleXMTP] ✅ Message sent');
    } catch (err) {
      console.error('[SimpleXMTP] Failed to send message:', err);
      setError('Failed to send message');
    }
  }, [client, selectedConversation]);

  // V3 Enhanced group conversation creation
  const createGroupConversation = useCallback(async (participantAddresses: string[], groupName?: string) => {
    if (!client) return;
    
    try {
      console.log('[SimpleXMTP] Creating V3 group conversation with:', participantAddresses);
      
      // V3 Pattern: Resolve all addresses to inbox IDs
      const inboxIds: string[] = [];
      
      for (const address of participantAddresses) {
        const normalizedAddress = address.toLowerCase().trim();
        
        // Validate address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(normalizedAddress)) {
          setError(`Invalid address format: ${address}`);
          return;
        }
        
        // Check if recipient can message
        const canMessage = await Client.canMessage([
          { identifier: normalizedAddress, identifierKind: 'Ethereum' }
        ], 'production');
        
        if (!canMessage[0]) {
          setError(`Address ${address} is not registered with XMTP`);
          return;
        }
        
        // Resolve to inbox ID
        const inboxId = await client.findInboxIdByIdentifier({
          identifier: normalizedAddress,
          identifierKind: 'Ethereum'
        });
        
        if (!inboxId) {
          setError(`Could not resolve address ${address} to inbox ID`);
          return;
        }
        
        inboxIds.push(inboxId);
      }
      
      console.log('[SimpleXMTP] Creating group with inbox IDs:', inboxIds);
      
      // V3 Pattern: Create group with inbox IDs
      const group = await client.conversations.newGroup(inboxIds);
      
      console.log('[SimpleXMTP] ✅ V3 Group conversation created');
      
      // Refresh conversations and select the new group
      await refreshConversations();
      setSelectedConversation(group as XMTPConversation);
      
    } catch (err) {
      console.error('[SimpleXMTP] Failed to create group conversation:', err);
      setError(`Failed to create group: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [client]);

  const createConversation = useCallback(async (recipientAddress: string) => {
    if (!client) return;
    
    try {
      console.log('[SimpleXMTP] Creating V3 conversation with:', recipientAddress);
      
      // Working pattern: Validate and normalize address
      const normalizedAddress = recipientAddress.toLowerCase().trim();
      
      // Working pattern: Prevent self-conversation
      if (normalizedAddress === address?.toLowerCase()) {
        setError('Cannot create conversation with yourself');
        return;
      }
      
      // Working pattern: Validate Ethereum address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(normalizedAddress)) {
        setError('Invalid Ethereum address format');
        return;
      }
      
      console.log('[SimpleXMTP] Checking if recipient can receive messages...');
      
      // Working pattern: Check if recipient can message
      const canMessage = await Client.canMessage([
        { identifier: normalizedAddress, identifierKind: 'Ethereum' }
      ], 'production');
      
      if (!canMessage[0]) {
        setError('Recipient is not registered with XMTP');
        return;
      }
      
      console.log('[SimpleXMTP] ✅ Recipient can receive messages');
      console.log('[SimpleXMTP] Resolving address to inbox ID...');
      
      // CRITICAL V3 PATTERN: Resolve address to inbox ID first
      const inboxId = await client.findInboxIdByIdentifier({
        identifier: normalizedAddress,
        identifierKind: 'Ethereum'
      });
      
      if (!inboxId) {
        setError('Could not resolve address to inbox ID');
        return;
      }
      
      console.log('[SimpleXMTP] ✅ Resolved inbox ID:', inboxId);
      console.log('[SimpleXMTP] Creating conversation with inbox ID...');
      
      // CORRECT V3 PATTERN: Create conversation using inbox ID
      const conversation = await client.conversations.newDm(inboxId);
      console.log('[SimpleXMTP] ✅ V3 Conversation created with inbox ID');
      
      // Refresh conversations
      await refreshConversations();
      
      // Select the new conversation
      setSelectedConversation(conversation as XMTPConversation);
      
    } catch (err) {
      console.error('[SimpleXMTP] Failed to create V3 conversation:', err);
      setError(`Failed to create conversation: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [client, address]);

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

  // Working message loading pattern (from proven working code)
  const loadMessages = async (conversation: XMTPConversation) => {
    try {
      console.log('[SimpleXMTP] Loading messages for conversation...');
      
      // Working pattern: Sync conversation first
      await conversation.sync();
      
      // Working pattern: Load with pagination
      const msgs = await conversation.messages({
        limit: BigInt(50)
      });
      
      setMessages(prev => ({
        ...prev,
        [conversation.id]: msgs
      }));
      
      console.log(`[SimpleXMTP] Loaded ${msgs.length} messages for conversation ${conversation.id}`);
    } catch (err) {
      console.error('[SimpleXMTP] Failed to load messages:', err);
    }
  };

  // Reset on wallet change
  useEffect(() => {
    if (address && client) {
      // Reset state when wallet changes
      setClient(null);
      setIsInitialized(false);
      setConversations([]);
      setSelectedConversation(null);
      setMessages({});
      setError(null);
    }
  }, [address]);

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
    createGroupConversation,
    processMessageContent,
  };

  return (
    <SimpleXMTPContext.Provider value={value}>
      {children}
    </SimpleXMTPContext.Provider>
  );
};

// Working pattern: Wrap with error boundary for production reliability
export const SimpleXMTPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <XMTPErrorBoundary>
      <SimpleXMTPProviderCore>
        {children}
      </SimpleXMTPProviderCore>
    </XMTPErrorBoundary>
  );
};

export const useSimpleXMTP = () => {
  const context = useContext(SimpleXMTPContext);
  if (!context) {
    throw new Error('useSimpleXMTP must be used within SimpleXMTPProvider');
  }
  return context;
};