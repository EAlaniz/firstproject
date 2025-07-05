import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { 
  Client, 
  DecodedMessage, 
  Dm, 
  Group, 
  ConsentState
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
  sendMessage: (text: string, contentType?: any) => Promise<void>;
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
      return inboxId || null;
    } catch (err) {
      console.error('[SimpleXMTP] Failed to resolve address to inbox ID:', err);
      return null;
    }
  }, [client]);


  // Browser SDK V3 initialization - correct pattern for web environments
  const initialize = useCallback(async () => {
    if (!walletClient || !address || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[SimpleXMTP] Initializing XMTP Browser SDK client...');
      
      // Browser SDK pattern: Enforce single tab access
      const tabId = sessionStorage.getItem('xmtp-tab-id');
      if (tabId) {
        setError('XMTP is already running in another tab. Please close other tabs first.');
        setIsLoading(false);
        return;
      }
      
      const newTabId = `${Date.now()}-${Math.random()}`;
      sessionStorage.setItem('xmtp-tab-id', newTabId);
      
      // Cleanup tab ID on unload
      const cleanup = () => {
        const currentTabId = sessionStorage.getItem('xmtp-tab-id');
        if (currentTabId === newTabId) {
          sessionStorage.removeItem('xmtp-tab-id');
        }
      };
      window.addEventListener('beforeunload', cleanup);
      
      const signer = createAutoSigner(walletClient);
      
      // CORRECT Browser SDK pattern: NO dbEncryptionKey
      const xmtpClient = await Client.create(signer, { 
        env: 'production'
        // NOTE: Browser SDK does NOT use dbEncryptionKey
        // Database is unencrypted due to technical limitations in web environments
      });
      
      setClient(xmtpClient);
      setIsInitialized(true);
      
      // Load initial conversations
      await loadConversations(xmtpClient);
      
      // Start streaming with proper Browser SDK pattern
      startStreaming(xmtpClient);
      
      console.log('[SimpleXMTP] ✅ Browser SDK initialization complete');
      
    } catch (err) {
      console.error('[SimpleXMTP] Browser SDK initialization failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Initialization failed';
      
      if (errorMessage.includes('already registered 5/5 installations')) {
        setError('Installation limit reached (5/5). Please clear browser data to revoke old installations and try again.');
      } else if (errorMessage.includes('simultaneous connections')) {
        setError('XMTP is already active in another tab. Please close other tabs.');
      } else {
        setError(errorMessage);
      }
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

  // Browser SDK V3 streaming - correct pattern with consent filtering
  const startStreaming = async (xmtpClient: Client) => {
    try {
      console.log('[SimpleXMTP] Starting Browser SDK message stream...');
      
      // Browser SDK pattern: Sync before streaming
      await xmtpClient.conversations.sync();
      
      // CORRECT Browser SDK pattern: Stream with consent filtering
      const stream = await xmtpClient.conversations.streamAllMessages(undefined, undefined, [ConsentState.Allowed]);
      
      for await (const message of stream) {
        if (!message) continue;
        
        console.log('[SimpleXMTP] New stream message:', message);
        
        // Filter own messages using inboxId
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
            console.log('[SimpleXMTP] 🆕 NEW INCOMING CONVERSATION detected:', message.conversationId);
            
            // Trigger conversation refresh
            setTimeout(() => {
              loadConversations(xmtpClient);
            }, 500);
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('[SimpleXMTP] Browser SDK streaming error:', err);
      
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      // Browser SDK specific error handling
      if (errorMessage.includes('group with welcome id')) {
        console.error('[SimpleXMTP] 🚨 Database inconsistency detected:', errorMessage);
        setError('Database inconsistency detected. Please clear browser data and re-initialize.');
        return; // Don't retry - Browser SDK database is likely corrupted
      }
      
      if (errorMessage.includes('simultaneous connections')) {
        setError('Multiple tabs detected. Browser SDK only supports single tab access.');
        return;
      }
      
      // Limited retry for other errors
      console.log('[SimpleXMTP] Retrying streaming in 5 seconds...');
      setTimeout(() => startStreaming(xmtpClient), 5000);
    }
  };

  // V3 Enhanced message sending with content type support
  const sendMessage = useCallback(async (text: string, contentType?: any) => {
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
  const createGroupConversation = useCallback(async (participantAddresses: string[], _groupName?: string) => {
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
        
        if (!canMessage.get(normalizedAddress)) {
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
      
      if (!canMessage.get(normalizedAddress)) {
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

  // Browser SDK cleanup handling
  useEffect(() => {
    if (address && client) {
      console.log('[SimpleXMTP] Wallet address changed, resetting XMTP state');
      
      // Clear tab ID to allow reinitialization
      sessionStorage.removeItem('xmtp-tab-id');
      
      // Reset state when wallet changes
      setClient(null);
      setIsInitialized(false);
      setConversations([]);
      setSelectedConversation(null);
      setMessages({});
      setError(null);
    }
  }, [address]);
  
  // Browser SDK cleanup on unmount
  useEffect(() => {
    return () => {
      if (client) {
        console.log('[SimpleXMTP] Cleaning up Browser SDK resources on unmount');
        
        // Clear tab ID to allow reinitialization
        sessionStorage.removeItem('xmtp-tab-id');
        
        // Reset all state
        setClient(null);
        setIsInitialized(false);
        setConversations([]);
        setSelectedConversation(null);
        setMessages({});
        setError(null);
      }
    };
  }, [client]);

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