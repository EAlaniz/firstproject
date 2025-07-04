import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Client, DecodedMessage, Dm, Group } from '@xmtp/browser-sdk';
import { createAutoSigner } from '../utils/xmtpSigner';

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
  messages: { [conversationId: string]: DecodedMessage<string>[] };
  
  // Actions
  initialize: () => Promise<void>;
  selectConversation: (conversation: XMTPConversation) => void;
  sendMessage: (text: string) => Promise<void>;
  createConversation: (recipientAddress: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
}

const SimpleXMTPContext = createContext<SimpleXMTPContextType | undefined>(undefined);

export const SimpleXMTPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  // Simple state
  const [client, setClient] = useState<Client | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<XMTPConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<XMTPConversation | null>(null);
  const [messages, setMessages] = useState<{ [conversationId: string]: DecodedMessage<string>[] }>({});

  // Simple initialization - official XMTP pattern
  const initialize = useCallback(async () => {
    if (!walletClient || !address || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[SimpleXMTP] Initializing XMTP client...');
      
      // Official pattern: Create signer and client
      const signer = createAutoSigner(walletClient);
      const xmtpClient = await Client.create(signer, { 
        env: 'production',
        dbEncryptionKey: await getOrCreateEncryptionKey(address)
      });
      
      setClient(xmtpClient);
      setIsInitialized(true);
      
      // Load initial conversations
      await loadConversations(xmtpClient);
      
      // Start simple streaming
      startStreaming(xmtpClient);
      
      console.log('[SimpleXMTP] ✅ Initialization complete');
      
    } catch (err) {
      console.error('[SimpleXMTP] Initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Initialization failed');
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, address, isLoading]);

  // Simple conversation loading - official XMTP pattern
  const loadConversations = async (xmtpClient: Client) => {
    try {
      console.log('[SimpleXMTP] Loading conversations...');
      await xmtpClient.conversations.sync();
      const convs = await xmtpClient.conversations.list();
      setConversations(convs as XMTPConversation[]);
      console.log(`[SimpleXMTP] Loaded ${convs.length} conversations`);
    } catch (err) {
      console.error('[SimpleXMTP] Failed to load conversations:', err);
    }
  };

  // Simple streaming - official XMTP pattern
  const startStreaming = async (xmtpClient: Client) => {
    try {
      console.log('[SimpleXMTP] Starting message stream...');
      
      // Official pattern: Simple streaming loop
      for await (const message of xmtpClient.conversations.streamAllMessages()) {
        console.log('[SimpleXMTP] New message received:', message);
        
        // Update messages
        setMessages(prev => ({
          ...prev,
          [message.conversationId]: [
            ...(prev[message.conversationId] || []),
            message
          ]
        }));
        
        // Check for new conversations
        const currentConvIds = conversations.map(c => c.id);
        if (!currentConvIds.includes(message.conversationId)) {
          console.log('[SimpleXMTP] New conversation detected, refreshing...');
          loadConversations(xmtpClient);
        }
      }
    } catch (err) {
      console.error('[SimpleXMTP] Streaming error:', err);
      // Simple retry after 5 seconds
      setTimeout(() => startStreaming(xmtpClient), 5000);
    }
  };

  // Simple message sending - official XMTP pattern
  const sendMessage = useCallback(async (text: string) => {
    if (!client || !selectedConversation) return;
    
    try {
      console.log('[SimpleXMTP] Sending message...');
      await selectedConversation.send(text);
      console.log('[SimpleXMTP] ✅ Message sent');
    } catch (err) {
      console.error('[SimpleXMTP] Failed to send message:', err);
      setError('Failed to send message');
    }
  }, [client, selectedConversation]);

  // Simple conversation creation - official XMTP pattern
  const createConversation = useCallback(async (recipientAddress: string) => {
    if (!client) return;
    
    try {
      console.log('[SimpleXMTP] Creating conversation with:', recipientAddress);
      
      // Check if recipient can message
      const canMessage = await Client.canMessage([
        { identifier: recipientAddress, identifierKind: 'Ethereum' }
      ], 'production');
      
      if (!canMessage[0]) {
        setError('Recipient is not registered with XMTP');
        return;
      }
      
      // Create conversation
      const conversation = await client.conversations.newDm(recipientAddress);
      console.log('[SimpleXMTP] ✅ Conversation created');
      
      // Refresh conversations
      await refreshConversations();
      
      // Select the new conversation
      setSelectedConversation(conversation as XMTPConversation);
      
    } catch (err) {
      console.error('[SimpleXMTP] Failed to create conversation:', err);
      setError('Failed to create conversation');
    }
  }, [client]);

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

  // Simple message loading for conversation
  const loadMessages = async (conversation: XMTPConversation) => {
    try {
      console.log('[SimpleXMTP] Loading messages for conversation...');
      const msgs = await conversation.messages();
      setMessages(prev => ({
        ...prev,
        [conversation.id]: msgs
      }));
    } catch (err) {
      console.error('[SimpleXMTP] Failed to load messages:', err);
    }
  };

  // Simple encryption key management
  const getOrCreateEncryptionKey = async (address: string): Promise<Uint8Array> => {
    const keyName = `xmtp-key-${address}`;
    const stored = localStorage.getItem(keyName);
    
    if (stored) {
      return new Uint8Array(JSON.parse(stored));
    }
    
    const key = crypto.getRandomValues(new Uint8Array(32));
    localStorage.setItem(keyName, JSON.stringify(Array.from(key)));
    return key;
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
  };

  return (
    <SimpleXMTPContext.Provider value={value}>
      {children}
    </SimpleXMTPContext.Provider>
  );
};

export const useSimpleXMTP = () => {
  const context = useContext(SimpleXMTPContext);
  if (!context) {
    throw new Error('useSimpleXMTP must be used within SimpleXMTPProvider');
  }
  return context;
};